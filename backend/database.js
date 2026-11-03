const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const config = require("./config");

const databasePath = config.databasePath;
const migrationsPath = path.join(__dirname, "migrations");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
function ensureRbacTableShape(tableName, requiredColumns) {
  const table = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
  if (!table) return;
  const columns = new Set(database.prepare(`PRAGMA table_info(${tableName})`).all().map(column => column.name));
  if (requiredColumns.every(column => columns.has(column))) return;
  let legacyName = `${tableName}_legacy`;
  let suffix = 1;
  while (database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(legacyName)) {
    legacyName = `${tableName}_legacy_${suffix++}`;
  }
  database.exec(`ALTER TABLE ${tableName} RENAME TO ${legacyName}`);
}

ensureRbacTableShape('rbac_roles', ['role_key', 'display_name']);
ensureRbacTableShape('rbac_permissions', ['permission_key', 'display_name']);
ensureRbacTableShape('rbac_role_permissions', ['role_id', 'permission_id']);
ensureRbacTableShape('rbac_user_roles', ['user_id', 'role_id']);
ensureRbacTableShape('authorization_audit_events', ['actor_subject', 'actor_provider', 'action', 'target_user_id', 'metadata']);

for (const migrationFile of fs.readdirSync(migrationsPath).filter((file) => file.endsWith(".sql")).sort()) {
  // SQLite has no ADD COLUMN IF NOT EXISTS, and migrations re-run on every start.
  if (migrationFile === "017-user-management-status.sql" && database.prepare("PRAGMA table_info(users)").all().some((column) => column.name === "is_active")) continue;
  database.exec(fs.readFileSync(path.join(migrationsPath, migrationFile), "utf8"));
}

if (!database.prepare("PRAGMA table_info(users)").all().some((column) => column.name === "password_hash")) {
  database.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
}
if (!database.prepare("PRAGMA table_info(users)").all().some((column) => column.name === "must_change_password")) {
  database.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0");
}
database.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_nocase ON users (email COLLATE NOCASE)");

// Local-development bootstrap: the seeded administrator gets a known initial password that must be changed at first sign-in.
if (String(process.env.AUTH_MODE || "").toLowerCase() === "development") {
  const { hashPassword } = require("./auth/password");
  const initialPassword = process.env.DEFAULT_ADMIN_PASSWORD || "ChangeMe-Song-2026!";
  database.prepare("UPDATE users SET password_hash = ? WHERE id = 'user-dcfran' AND password_hash IS NULL").run(hashPassword(initialPassword));
  database.prepare("UPDATE users SET must_change_password = 0 WHERE id = 'user-dcfran'").run();
}

const { validateAnnouncementPage } = require('./content/announcement-schema');
const { ContentConflictError, ContentValidationError } = require('./content/errors');

function contentDocument(pageKey) {
  const document = database.prepare('SELECT * FROM content_documents WHERE page_key = ?').get(pageKey);
  if (!document) throw new Error(`Unknown content page: ${pageKey}`);
  return document;
}

function contentVersion(row) {
  if (!row) return null;
  return { id: Number(row.id), version: Number(row.version_number), state: row.state, payload: JSON.parse(row.payload), authoredBy: row.authored_by, authoredProvider: row.authored_provider, createdAt: row.created_at, publishedAt: row.published_at };
}

function getPublishedContent(pageKey) {
  const document = contentDocument(pageKey);
  return contentVersion(database.prepare('SELECT * FROM content_versions WHERE id = ?').get(document.published_version_id));
}

function getDraftContent(pageKey) {
  const document = contentDocument(pageKey);
  return contentVersion(database.prepare("SELECT * FROM content_versions WHERE document_id = ? AND state = 'draft' ORDER BY version_number DESC LIMIT 1").get(document.id));
}

function previewContent(pageKey, payload) {
  contentDocument(pageKey);
  const validation = validateAnnouncementPage(payload);
  if (!validation.valid) throw new ContentValidationError(validation.errors);
  return { pageKey, valid: true, payload };
}

function nextContentVersion(documentId) {
  return Number(database.prepare('SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM content_versions WHERE document_id = ?').get(documentId).next);
}

function auditContent(documentId, versionId, principal, action, sourceVersion, targetVersion, metadata = {}) {
  database.prepare(`INSERT INTO content_audit_events (document_id, version_id, actor_subject, actor_provider, action, source_version, target_version, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(documentId, versionId || null, principal.subject, principal.provider, action, sourceVersion || null, targetVersion || null, JSON.stringify(metadata), new Date().toISOString());
}

function saveContentDraft(pageKey, payload, principal, expectedVersion, action = 'draft_saved') {
  const validation = validateAnnouncementPage(payload);
  if (!validation.valid) throw new ContentValidationError(validation.errors);
  const document = contentDocument(pageKey);
  const current = database.prepare("SELECT * FROM content_versions WHERE document_id = ? AND state <> 'discarded' ORDER BY version_number DESC LIMIT 1").get(document.id);
  if (expectedVersion !== undefined && Number(expectedVersion) !== Number(current?.version_number)) throw new ContentConflictError('Content changed since it was loaded', contentVersion(current));
  database.exec('BEGIN');
  try {
    database.prepare("UPDATE content_versions SET state = 'superseded' WHERE document_id = ? AND state = 'draft'").run(document.id);
    const version = nextContentVersion(document.id);
    const now = new Date().toISOString();
    const result = database.prepare(`INSERT INTO content_versions (document_id, version_number, state, base_version_number, payload, authored_by, authored_provider, created_at, change_summary) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?)`)
      .run(document.id, version, current?.version_number || null, JSON.stringify(payload), principal.subject, principal.provider, now, 'Draft saved');
    auditContent(document.id, result.lastInsertRowid, principal, action, current?.version_number, version);
    database.prepare('UPDATE content_documents SET updated_at = ? WHERE id = ?').run(now, document.id);
    database.exec('COMMIT');
    return contentVersion(database.prepare('SELECT * FROM content_versions WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) { database.exec('ROLLBACK'); throw error; }
}

function discardContentDraft(pageKey, principal, expectedVersion) {
  const document = contentDocument(pageKey);
  const draft = getDraftContent(pageKey);
  if (!draft) return null;
  if (expectedVersion !== undefined && Number(expectedVersion) !== draft.version) throw new ContentConflictError('Content changed since it was loaded', draft);
  database.prepare("UPDATE content_versions SET state = 'discarded' WHERE id = ?").run(draft.id);
  auditContent(document.id, draft.id, principal, 'draft_discarded', draft.version, null);
  return draft;
}

function publishContent(pageKey, principal, expectedVersion) {
  const document = contentDocument(pageKey);
  const draft = getDraftContent(pageKey);
  if (!draft) throw new ContentValidationError(['A draft is required before publishing']);
  if (Number(expectedVersion) !== draft.version) throw new ContentConflictError('Content changed since it was loaded', draft);
  database.exec('BEGIN');
  try {
    const oldPublished = getPublishedContent(pageKey);
    const now = new Date().toISOString();
    const version = nextContentVersion(document.id);
    database.prepare("UPDATE content_versions SET state = 'superseded' WHERE document_id = ? AND state IN ('published', 'draft')").run(document.id);
    const result = database.prepare(`INSERT INTO content_versions (document_id, version_number, state, base_version_number, payload, authored_by, authored_provider, created_at, published_by, published_at, change_summary) VALUES (?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(document.id, version, draft.version, JSON.stringify(draft.payload), draft.authoredBy, draft.authoredProvider, now, principal.subject, now, 'Published announcement content');
    database.prepare('UPDATE content_documents SET published_version_id = ?, updated_at = ? WHERE id = ?').run(result.lastInsertRowid, now, document.id);
    auditContent(document.id, result.lastInsertRowid, principal, 'published', oldPublished?.version, version);
    database.exec('COMMIT');
    return contentVersion(database.prepare('SELECT * FROM content_versions WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) { database.exec('ROLLBACK'); throw error; }
}

function listContentVersions(pageKey) {
  const document = contentDocument(pageKey);
  return database.prepare('SELECT * FROM content_versions WHERE document_id = ? ORDER BY version_number DESC').all(document.id).map(contentVersion);
}

function listContentAuditEvents(pageKey) {
  const document = contentDocument(pageKey);
  return database.prepare('SELECT action, actor_subject AS actorSubject, source_version AS sourceVersion, target_version AS targetVersion FROM content_audit_events WHERE document_id = ? ORDER BY id DESC').all(document.id);
}

function restoreContentVersion(pageKey, versionId, principal, expectedVersion) {
  const document = contentDocument(pageKey);
  const source = database.prepare('SELECT * FROM content_versions WHERE id = ? AND document_id = ?').get(versionId, document.id);
  if (!source) return null;
  return saveContentDraft(pageKey, JSON.parse(source.payload), principal, expectedVersion, 'restored');
}

function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    progress: row.progress,
    url: row.url,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    actualDuration: row.actual_duration,
    description: row.description,
    externalLinks: JSON.parse(row.external_links || "[]")
  };
}

function getTasks(table) {
  return database.prepare(`SELECT * FROM ${table} ORDER BY id`).all().map(toTask);
}

function getProgress(table) {
  const rows = database.prepare(`SELECT status FROM ${table}`).all();
  if (rows.length === 0) return 0;

  const score = rows.reduce((total, row) => {
    if (row.status === "Completed") return total + 1;
    if (row.status === "In Progress") return total + 0.5;
    if (row.status === "Pending") return total + 0.25;
    return total;
  }, 0);

  return Math.round((score / rows.length) * 100);
}

function createTask(table, record) {
  const id = Number(record.id || Date.now());
  database.prepare(`
    INSERT INTO ${table} (
      id, title, start_date, end_date, status, progress, url, started_at,
      completed_at, actual_duration, description, external_links
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    record.title || "",
    record.startDate || "",
    record.endDate || "",
    record.status || "Not Started",
    Number(record.progress || 0),
    record.url || "",
    record.startedAt || "",
    record.completedAt || "",
    String(record.actualDuration ?? ""),
    record.description || "",
    JSON.stringify(record.externalLinks || [])
  );
  return toTask(database.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));
}

function updateTask(table, id, updates) {
  const columns = {
    title: "title",
    startDate: "start_date",
    endDate: "end_date",
    status: "status",
    progress: "progress",
    url: "url",
    startedAt: "started_at",
    completedAt: "completed_at",
    actualDuration: "actual_duration",
    description: "description",
    externalLinks: "external_links"
  };
  const entries = Object.entries(updates)
    .filter(([key]) => columns[key])
    .map(([key, value]) => [columns[key], key === "externalLinks" ? JSON.stringify(value) : value]);

  if (entries.length > 0) {
    const assignments = entries.map(([column]) => `${column} = ?`).join(", ");
    database.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ?`).run(...entries.map(([, value]) => value), id);
  }

  const task = database.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  return task ? toTask(task) : null;
}

function updateTaskStatus(table, id, action) {
  const task = database.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!task) return null;

  const now = new Date().toISOString();
  if (action === "start") {
    database.prepare(`
      UPDATE ${table}
      SET status = 'In Progress', start_date = ?, started_at = ?
      WHERE id = ?
    `).run(now.split("T")[0], now, id);
  } else if (action === "complete") {
    const actualDuration = task.started_at
      ? Math.round((Date.parse(now) - Date.parse(task.started_at)) / 60000)
      : task.actual_duration;
    database.prepare(`
      UPDATE ${table}
      SET status = 'Completed', end_date = ?, completed_at = ?, progress = 100, actual_duration = ?
      WHERE id = ?
    `).run(now.split("T")[0], now, actualDuration, id);
  }

  return database.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)
    ? toTask(database.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id))
    : null;
}

function getLeadership() {
  const result = {};
  for (const row of database.prepare("SELECT section_name, payload FROM leadership_sections ORDER BY section_name, item_id").all()) {
    (result[row.section_name] ||= []).push(JSON.parse(row.payload));
  }
  return result;
}

function updateLeadershipItem(sectionName, itemId, payload) {
  const result = database.prepare(
    "UPDATE leadership_sections SET payload = ? WHERE section_name = ? AND item_id = ?"
  ).run(JSON.stringify(payload), sectionName, itemId);
  return result.changes > 0;
}

function getHomeSpotlight() {
  const spotlight = database.prepare("SELECT title FROM home_spotlight WHERE id = 1").get();
  const persons = database.prepare("SELECT payload FROM home_spotlight_people ORDER BY id").all().map((row) => JSON.parse(row.payload));
  return { title: spotlight.title, persons };
}

function updateHomeSpotlight(spotlight) {
  database.exec("BEGIN");
  try {
    database.prepare("UPDATE home_spotlight SET title = ? WHERE id = 1").run(spotlight.title || "");
    database.prepare("DELETE FROM home_spotlight_people").run();
    const insertPerson = database.prepare("INSERT INTO home_spotlight_people (id, payload) VALUES (?, ?)");
    for (const person of spotlight.persons || []) insertPerson.run(person.id, JSON.stringify(person));
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return getHomeSpotlight();
}

function getAnnouncements() {
  return database.prepare("SELECT id, icon, title, body FROM announcements ORDER BY id").all();
}

function updateAnnouncement(id, updates) {
  const allowed = { icon: "icon", title: "title", body: "body" };
  const entries = Object.entries(updates)
    .filter(([key]) => allowed[key])
    .map(([key, value]) => [allowed[key], value]);
  if (entries.length > 0) {
    const assignments = entries.map(([column]) => `${column} = ?`).join(", ");
    database.prepare(`UPDATE announcements SET ${assignments} WHERE id = ?`).run(...entries.map(([, value]) => value), id);
  }
  return database.prepare("SELECT id, icon, title, body FROM announcements WHERE id = ?").get(id) || null;
}

function getSongLinks() {
  return database.prepare("SELECT id, title FROM song_link_sections ORDER BY id").all().map((section) => ({
    title: section.title,
    cards: database.prepare("SELECT payload FROM song_link_cards WHERE section_id = ? ORDER BY card_id").all(section.id).map((row) => JSON.parse(row.payload))
  }));
}

function updateSongLink(sectionId, cardId, payload) {
  const result = database.prepare(
    "UPDATE song_link_cards SET payload = ? WHERE section_id = ? AND card_id = ?"
  ).run(JSON.stringify(payload), sectionId, cardId);
  return result.changes > 0;
}

function toJourneyItem(row) {
  return {
    id: row.id,
    label: row.label,
    route: row.route,
    text: row.description,
    image: row.image,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    lastUpdated: row.last_updated,
    isExpanded: Boolean(row.is_expanded)
  };
}

function getJourneyItems() {
  return database.prepare("SELECT * FROM journey_items ORDER BY id").all().map(toJourneyItem);
}

function updateJourneyItem(id, updates) {
  const allowed = {
    status: "status",
    startDate: "start_date",
    endDate: "end_date",
    lastUpdated: "last_updated",
    isExpanded: "is_expanded"
  };
  const entries = Object.entries(updates)
    .filter(([key]) => allowed[key])
    .map(([key, value]) => [allowed[key], key === "isExpanded" ? (value ? 1 : 0) : value]);
  if (entries.length > 0) {
    const assignments = entries.map(([column]) => `${column} = ?`).join(", ");
    database.prepare(`UPDATE journey_items SET ${assignments} WHERE id = ?`).run(...entries.map(([, value]) => value), id);
  }
  const item = database.prepare("SELECT * FROM journey_items WHERE id = ?").get(id);
  return item ? toJourneyItem(item) : null;
}

function getPrincipalBySubject(subject, provider = 'development') {
  const rows = database.prepare(`SELECT u.id, u.email, u.display_name, u.is_active, u.must_change_password, ? AS provider, u.id AS subject,
    r.role_key, p.permission_key FROM users u
    LEFT JOIN rbac_user_roles ur ON ur.user_id = u.id
    LEFT JOIN rbac_roles r ON r.id = ur.role_id
    LEFT JOIN rbac_role_permissions rp ON rp.role_id = r.id
    LEFT JOIN rbac_permissions p ON p.id = rp.permission_id
    WHERE ? IN ('development', 'local') AND u.id = ?`).all(provider, provider, subject);
  if (!rows.length) return null;
  return { provider: rows[0].provider, issuer: ['development', 'local'].includes(rows[0].provider) ? 'local.song-site' : 'entra', subject: rows[0].subject, userId: rows[0].id, displayName: rows[0].display_name, email: rows[0].email, roles: [...new Set(rows.map(row => row.role_key).filter(Boolean))], role: rows.find(row => row.role_key)?.role_key || null, permissions: [...new Set(rows.map(row => row.permission_key).filter(Boolean))], isActive: Boolean(rows[0].is_active), mustChangePassword: Boolean(rows[0].must_change_password) };
}

function listRbacUsers() {
  return database.prepare(`SELECT u.id, u.email, u.display_name AS displayName, 'development' AS provider, u.id AS subject, u.is_active AS isActive,
    COALESCE(GROUP_CONCAT(DISTINCT r.role_key), '') AS roles FROM users u
    LEFT JOIN rbac_user_roles ur ON ur.user_id = u.id LEFT JOIN rbac_roles r ON r.id = ur.role_id
    GROUP BY u.id ORDER BY u.display_name`).all().map(row => ({ ...row, isActive: Boolean(row.isActive), roles: row.roles ? row.roles.split(',') : [] }));
}

function updateUserProfile(userId, updates, actor) {
  const user = database.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) return undefined;
  const fields = [];
  const values = [];
  if (updates.displayName !== undefined) { fields.push('display_name = ?'); values.push(updates.displayName); }
  if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
  if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
  if (fields.length) {
    fields.push('updated_at = ?'); values.push(new Date().toISOString()); values.push(userId);
    database.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  database.prepare('INSERT INTO authorization_audit_events (actor_subject, actor_provider, action, target_user_id, metadata) VALUES (?, ?, ?, ?, ?)').run(actor.subject, actor.provider, 'user_profile_updated', userId, JSON.stringify({ fields: Object.keys(updates).filter(key => updates[key] !== undefined) }));
  return listRbacUsers().find(candidate => candidate.id === userId) || undefined;
}

function summarizeTasks(table) {
  const rows = database.prepare(`SELECT status FROM ${table}`).all();
  const counts = { 'Not Started': 0, 'In Progress': 0, Pending: 0, Completed: 0 };
  for (const row of rows) counts[row.status] = (counts[row.status] || 0) + 1;
  const score = rows.reduce((total, row) => total + ({ Completed: 1, 'In Progress': 0.5, Pending: 0.25 }[row.status] || 0), 0);
  return { total: rows.length, completed: counts.Completed, inProgress: counts['In Progress'], pending: counts.Pending, notStarted: counts['Not Started'], progress: rows.length ? Math.round((score / rows.length) * 100) : 0 };
}

function dashboardInsights(principal) {
  const upNext = table => database.prepare(`SELECT id, title, status, end_date AS endDate FROM ${table} WHERE status <> 'Completed' ORDER BY CASE status WHEN 'In Progress' THEN 0 WHEN 'Pending' THEN 1 ELSE 2 END, CASE WHEN end_date = '' THEN 1 ELSE 0 END, end_date, id LIMIT 5`).all();
  const recentCompletions = database.prepare(`SELECT kind, title, completed_at AS completedAt FROM (
    SELECT 'Journey' AS kind, title, completed_at FROM tasks WHERE completed_at <> ''
    UNION ALL SELECT 'Training', title, completed_at FROM training_tasks WHERE completed_at <> '') ORDER BY completed_at DESC LIMIT 6`).all();
  const insights = { upNext: { journey: upNext('tasks'), training: upNext('training_tasks') }, recentCompletions };
  if (principal?.permissions?.includes('rbac:users:read')) {
    insights.roleBreakdown = database.prepare(`SELECT r.display_name AS role, COUNT(ur.user_id) AS users FROM rbac_roles r LEFT JOIN rbac_user_roles ur ON ur.role_id = r.id GROUP BY r.id ORDER BY users DESC, r.display_name`).all().map(row => ({ role: row.role, users: Number(row.users) }));
    insights.accountStatus = database.prepare('SELECT SUM(is_active) AS active, SUM(1 - is_active) AS inactive FROM users').get();
    insights.accountStatus = { active: Number(insights.accountStatus.active || 0), inactive: Number(insights.accountStatus.inactive || 0) };
    insights.recentActivity = database.prepare('SELECT action, actor_subject AS actor, target_user_id AS target, created_at AS at FROM authorization_audit_events ORDER BY id DESC LIMIT 6').all();
  }
  return insights;
}

function getDashboardSummary(principal) {
  const journey = summarizeTasks('tasks');
  const training = summarizeTasks('training_tasks');
  const cards = [
    { key: 'journey-progress', label: 'Journey progress', value: `${journey.progress}%`, detail: `${journey.completed} of ${journey.total} tasks completed` },
    { key: 'training-progress', label: 'Training progress', value: `${training.progress}%`, detail: `${training.completed} of ${training.total} tasks completed` },
    { key: 'announcements', label: 'Announcements', value: database.prepare('SELECT COUNT(*) AS count FROM announcements').get().count, detail: 'Published public notices' },
  ];
  if (principal?.permissions?.includes('rbac:users:read')) {
    cards.push({ key: 'users', label: 'Users', value: database.prepare('SELECT COUNT(*) AS count FROM users').get().count, detail: 'Identities visible to your role' });
    cards.push({ key: 'roles', label: 'Roles', value: database.prepare('SELECT COUNT(*) AS count FROM rbac_roles').get().count, detail: 'Defined role assignments' });
  }
  return { identity: principal ? { displayName: principal.displayName, email: principal.email, role: principal.role, mode: principal.provider } : null, cards, ...dashboardInsights(principal), charts: [
    { key: 'journey-status', title: 'Journey task status', segments: [{ label: 'Completed', value: journey.completed }, { label: 'In Progress', value: journey.inProgress }, { label: 'Pending', value: journey.pending }, { label: 'Not Started', value: journey.notStarted }] },
    { key: 'training-status', title: 'Training task status', segments: [{ label: 'Completed', value: training.completed }, { label: 'In Progress', value: training.inProgress }, { label: 'Pending', value: training.pending }, { label: 'Not Started', value: training.notStarted }] },
  ] };
}

function assignRbacRoles(userId, roleKeys, actor) {
  const roles = [...new Set(roleKeys)];
  const placeholders = roles.map(() => '?').join(',');
  const available = roles.length ? database.prepare(`SELECT role_key FROM rbac_roles WHERE role_key IN (${placeholders})`).all(...roles).map(row => row.role_key) : [];
  if (available.length !== roles.length) return null;
  const user = database.prepare("SELECT id AS subject, 'development' AS provider FROM users WHERE id = ?").get(userId);
  if (!user) return undefined;
  database.exec('BEGIN');
  try {
    database.prepare('DELETE FROM rbac_user_roles WHERE user_id = ?').run(userId);
    const insert = database.prepare('INSERT INTO rbac_user_roles (user_id, role_id, assigned_by) SELECT ?, id, ? FROM rbac_roles WHERE role_key = ?');
    for (const roleKey of roles) insert.run(userId, actor.subject, roleKey);
    database.prepare('INSERT INTO authorization_audit_events (actor_subject, actor_provider, action, target_user_id, metadata) VALUES (?, ?, ?, ?, ?)').run(actor.subject, actor.provider, 'roles_replaced', userId, JSON.stringify({ roles }));
    database.exec('COMMIT');
  } catch (error) { database.exec('ROLLBACK'); throw error; }
  return getPrincipalBySubject(user.subject, user.provider);
}

function getLoginCredentialByEmail(email) {
  const row = database.prepare('SELECT id, password_hash AS passwordHash, is_active AS isActive FROM users WHERE email = ? COLLATE NOCASE').get(String(email));
  return row ? { id: row.id, passwordHash: row.passwordHash, isActive: Boolean(row.isActive) } : null;
}

function setUserPasswordHash(userId, passwordHash, actor) {
  const result = database.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?').run(passwordHash, new Date().toISOString(), userId);
  if (!result.changes) return false;
  if (actor) database.prepare('INSERT INTO authorization_audit_events (actor_subject, actor_provider, action, target_user_id, metadata) VALUES (?, ?, ?, ?, ?)').run(actor.subject, actor.provider, 'password_set', userId, '{}');
  return true;
}

function createLocalUser({ email, displayName, passwordHash, roles }, actor) {
  const available = roles.length ? database.prepare(`SELECT role_key FROM rbac_roles WHERE role_key IN (${roles.map(() => '?').join(',')})`).all(...roles).map(row => row.role_key) : [];
  if (available.length !== roles.length) return null;
  const id = `user-${require('node:crypto').randomUUID()}`;
  database.exec('BEGIN');
  try {
    database.prepare('INSERT INTO users (id, external_id, email, display_name, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)').run(id, id, email, displayName, roles[0] || 'user', passwordHash);
    const insert = database.prepare('INSERT INTO rbac_user_roles (user_id, role_id, assigned_by) SELECT ?, id, ? FROM rbac_roles WHERE role_key = ?');
    for (const roleKey of roles) insert.run(id, actor.subject, roleKey);
    database.prepare('INSERT INTO authorization_audit_events (actor_subject, actor_provider, action, target_user_id, metadata) VALUES (?, ?, ?, ?, ?)').run(actor.subject, actor.provider, 'user_created', id, JSON.stringify({ roles }));
    database.exec('COMMIT');
  } catch (error) { database.exec('ROLLBACK'); throw error; }
  return listRbacUsers().find(candidate => candidate.id === id);
}

module.exports = {
  getLoginCredentialByEmail,
  setUserPasswordHash,
  createLocalUser,
  createTask,
  getTasks,
  getProgress,
  updateTask,
  updateTaskStatus,
  getLeadership,
  updateLeadershipItem,
  getHomeSpotlight,
  updateHomeSpotlight,
  getAnnouncements,
  updateAnnouncement,
  getSongLinks,
  updateSongLink,
  getJourneyItems,
  updateJourneyItem,
  getPrincipalBySubject,
  listRbacUsers,
  updateUserProfile,
  getDashboardSummary,
  assignRbacRoles,
  getPublishedContent,
  getDraftContent,
  previewContent,
  saveContentDraft,
  discardContentDraft,
  publishContent,
  listContentVersions,
  listContentAuditEvents,
  restoreContentVersion,
  close: () => database.close()
};
