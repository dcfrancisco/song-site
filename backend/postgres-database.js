const { getPostgresPool, closePostgresPool } = require('./postgres');
const { validateAnnouncementPage } = require('./content/announcement-schema');
const { ContentConflictError, ContentValidationError } = require('./content/errors');

const taskTypes = { tasks: 'journey', training_tasks: 'training' };

function toTask(row) {
  return {
    id: Number(row.id), title: row.title, startDate: row.start_date || '', endDate: row.end_date || '',
    status: row.status, progress: row.progress, url: row.url || '', startedAt: row.started_at,
    completedAt: row.completed_at, actualDuration: row.actual_duration_minutes,
    description: row.description || '', externalLinks: row.external_links || []
  };
}

async function getTasks(table) {
  const result = await getPostgresPool().query(
    `SELECT t.*, COALESCE(json_agg(json_build_object('text', l.link_text, 'url', l.url)
      ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') AS external_links
       FROM tasks t LEFT JOIN task_links l ON l.task_id = t.id
      WHERE t.task_type = $1 AND t.is_active = TRUE GROUP BY t.id ORDER BY t.sort_order, t.id`,
    [taskTypes[table]]
  );
  return result.rows.map(toTask);
}

async function getProgress(table) {
  const tasks = await getTasks(table);
  if (!tasks.length) return 0;
  const score = tasks.reduce((total, task) => total + ({ Completed: 1, 'In Progress': 0.5, Pending: 0.25 }[task.status] || 0), 0);
  return Math.round((score / tasks.length) * 100);
}

async function getTask(table, id) {
  const tasks = await getTasks(table);
  return tasks.find(task => task.id === Number(id)) || null;
}

async function createTask(table, record) {
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO tasks (task_type, title, start_date, end_date, status, progress, url, started_at,
        completed_at, actual_duration_minutes, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         COALESCE((SELECT MAX(sort_order) + 1 FROM tasks WHERE task_type = $1), 1)) RETURNING id`,
      [taskTypes[table], record.title || '', record.startDate || null, record.endDate || null,
        record.status || 'Not Started', Number(record.progress || 0), record.url || null,
        record.startedAt || null, record.completedAt || null, record.actualDuration ?? null,
        record.description || null]
    );
    for (const [index, link] of (record.externalLinks || []).entries()) {
      await client.query('INSERT INTO task_links (task_id, link_text, url, sort_order) VALUES ($1, $2, $3, $4)', [result.rows[0].id, link.text, link.url, index + 1]);
    }
    await client.query('COMMIT');
    return getTask(table, result.rows[0].id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateTask(table, id, updates) {
  const columns = { title: 'title', startDate: 'start_date', endDate: 'end_date', status: 'status', progress: 'progress', url: 'url', startedAt: 'started_at', completedAt: 'completed_at', actualDuration: 'actual_duration_minutes', description: 'description' };
  const entries = Object.entries(updates).filter(([key]) => columns[key]);
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    if (entries.length) {
      const values = entries.map(([, value]) => value === '' ? null : value);
      const assignments = entries.map(([key], index) => `${columns[key]} = $${index + 1}`).join(', ');
      await client.query(`UPDATE tasks SET ${assignments}, updated_at = NOW() WHERE id = $${values.length + 1} AND task_type = $${values.length + 2}`, [...values, id, taskTypes[table]]);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'externalLinks')) {
      await client.query('DELETE FROM task_links WHERE task_id = $1', [id]);
      for (const [index, link] of (updates.externalLinks || []).entries()) await client.query('INSERT INTO task_links (task_id, link_text, url, sort_order) VALUES ($1, $2, $3, $4)', [id, link.text, link.url, index + 1]);
    }
    await client.query('COMMIT');
    return getTask(table, id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateTaskStatus(table, id, action) {
  const task = await getTask(table, id);
  if (!task) return null;
  const now = new Date();
  if (action === 'start') await getPostgresPool().query("UPDATE tasks SET status = 'In Progress', start_date = CURRENT_DATE, started_at = $1, updated_at = NOW() WHERE id = $2 AND task_type = $3", [now, id, taskTypes[table]]);
  if (action === 'complete') {
    const duration = task.startedAt ? Math.round((now - new Date(task.startedAt)) / 60000) : task.actualDuration;
    await getPostgresPool().query("UPDATE tasks SET status = 'Completed', end_date = CURRENT_DATE, completed_at = $1, progress = 100, actual_duration_minutes = $2, updated_at = NOW() WHERE id = $3 AND task_type = $4", [now, duration, id, taskTypes[table]]);
  }
  return getTask(table, id);
}

async function getLeadership() {
  const result = await getPostgresPool().query("SELECT section_name, payload FROM leadership_sections WHERE section_name <> 'orgChart' ORDER BY section_name, item_id");
  const data = {};
  for (const row of result.rows) (data[row.section_name] ||= []).push(row.payload);
  return data;
}

async function updateLeadershipItem(section, id, payload) {
  const patch = Object.fromEntries(['name', 'role', 'initials', 'photo', 'avatarColor', 'category'].filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]));
  const result = await getPostgresPool().query('UPDATE leadership_sections SET payload = payload || $1::jsonb WHERE section_name = $2 AND item_id = $3', [JSON.stringify(patch), section, id]);
  return result.rowCount > 0;
}

async function getHomeSpotlight() {
  const result = await getPostgresPool().query('SELECT * FROM home_spotlights WHERE is_active = TRUE ORDER BY sort_order');
  return { title: 'Congratulations to our Newly-certified Full Stack Developers!', persons: result.rows.map((row, index) => ({ id: Number(row.id) || index + 1, displayName: row.display_name, fullName: row.full_name, certification: row.certification, headshot: row.headshot_url, bio: row.bio, image: row.image_url })) };
}

async function updateHomeSpotlight(spotlight) {
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM home_spotlights');
    for (const [index, person] of (spotlight.persons || []).entries()) {
      await client.query(
        `INSERT INTO home_spotlights
          (display_name, full_name, certification, headshot_url, bio, image_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [person.displayName, person.fullName, person.certification, person.headshot, person.bio, person.image, index]
      );
    }
    await client.query('COMMIT');
    return getHomeSpotlight();
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getAnnouncements() {
  const result = await getPostgresPool().query('SELECT id, icon, title, body FROM home_announcements WHERE is_active = TRUE ORDER BY sort_order, id');
  return result.rows.map(row => ({ ...row, id: Number(row.id) }));
}

async function updateAnnouncement(id, updates) {
  const result = await getPostgresPool().query('UPDATE home_announcements SET icon = COALESCE($1, icon), title = COALESCE($2, title), body = COALESCE($3, body), updated_at = NOW() WHERE id = $4 RETURNING id, icon, title, body', [updates.icon, updates.title, updates.body, id]);
  return result.rows[0] ? { ...result.rows[0], id: Number(result.rows[0].id) } : null;
}

async function getSongLinks() {
  const result = await getPostgresPool().query('SELECT g.title AS group_title, l.title, l.description, l.link_text, l.url, l.external_link FROM song_link_groups g JOIN song_links l ON l.group_id = g.id WHERE g.is_active = TRUE AND l.is_active = TRUE ORDER BY g.sort_order, l.sort_order');
  const groups = {};
  for (const row of result.rows) (groups[row.group_title] ||= []).push({ title: row.title, description: row.description, linkText: row.link_text, url: row.url, external: row.external_link });
  return Object.entries(groups).map(([title, cards]) => ({ title, cards }));
}

async function updateSongLink(sectionId, cardId, payload) {
  const result = await getPostgresPool().query('UPDATE song_links SET title = COALESCE($1, title), description = COALESCE($2, description), link_text = COALESCE($3, link_text), url = COALESCE($4, url), external_link = COALESCE($5, external_link), updated_at = NOW() WHERE group_id = $6 AND sort_order = $7', [payload.title, payload.description, payload.linkText, payload.url, payload.external, sectionId, cardId]);
  return result.rowCount > 0;
}

async function getJourneyItems() {
  return (await getTasks('tasks')).map(task => ({ id: task.id, label: task.title, route: task.url, text: task.description, image: '', status: task.status, startDate: task.startDate, endDate: task.endDate, lastUpdated: task.completedAt || task.startedAt || '', isExpanded: false }));
}

async function updateJourneyItem(id, updates) {
  await updateTask('tasks', id, updates);
  return (await getJourneyItems()).find(item => item.id === Number(id)) || null;
}

function toContentVersion(row) {
  if (!row) return null;
  return { id: Number(row.id), version: Number(row.version_number), state: row.state, payload: row.payload, authoredBy: row.authored_by, authoredProvider: row.authored_provider, createdAt: row.created_at, publishedAt: row.published_at };
}
async function contentDocument(pageKey) { const result = await getPostgresPool().query('SELECT * FROM content_documents WHERE page_key = $1', [pageKey]); if (!result.rows[0]) throw new Error(`Unknown content page: ${pageKey}`); return result.rows[0]; }
async function getPublishedContent(pageKey) { const doc = await contentDocument(pageKey); const result = await getPostgresPool().query('SELECT * FROM content_versions WHERE id = $1', [doc.published_version_id]); return toContentVersion(result.rows[0]); }
async function getDraftContent(pageKey) { const doc = await contentDocument(pageKey); const result = await getPostgresPool().query("SELECT * FROM content_versions WHERE document_id = $1 AND state = 'draft' ORDER BY version_number DESC LIMIT 1", [doc.id]); return toContentVersion(result.rows[0]); }
async function previewContent(pageKey, payload) { await contentDocument(pageKey); const validation = validateAnnouncementPage(payload); if (!validation.valid) throw new ContentValidationError(validation.errors); return { pageKey, valid: true, payload }; }
async function saveContentDraft(pageKey, payload, principal, expectedVersion, action = 'draft_saved') {
  const validation = validateAnnouncementPage(payload); if (!validation.valid) throw new ContentValidationError(validation.errors);
  const doc = await contentDocument(pageKey); const client = await getPostgresPool().connect();
  try { await client.query('BEGIN'); const current = (await client.query("SELECT * FROM content_versions WHERE document_id = $1 AND state <> 'discarded' ORDER BY version_number DESC LIMIT 1 FOR UPDATE", [doc.id])).rows[0];
    if (expectedVersion !== undefined && Number(expectedVersion) !== Number(current?.version_number)) throw new ContentConflictError('Content changed since it was loaded', toContentVersion(current));
    await client.query("UPDATE content_versions SET state = 'superseded' WHERE document_id = $1 AND state = 'draft'", [doc.id]);
    const version = Number((await client.query('SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM content_versions WHERE document_id = $1', [doc.id])).rows[0].next);
    const result = await client.query(`INSERT INTO content_versions (document_id, version_number, state, base_version_number, payload, authored_by, authored_provider, change_summary) VALUES ($1,$2,'draft',$3,$4,$5,$6,'Draft saved') RETURNING *`, [doc.id, version, current?.version_number || null, payload, principal.subject, principal.provider]);
    await client.query(`INSERT INTO content_audit_events (document_id,version_id,actor_subject,actor_provider,action,source_version,target_version) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [doc.id, result.rows[0].id, principal.subject, principal.provider, action, current?.version_number || null, version]);
    await client.query('COMMIT'); return toContentVersion(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function publishContent(pageKey, principal, expectedVersion) {
  const doc = await contentDocument(pageKey); const client = await getPostgresPool().connect();
  try { await client.query('BEGIN'); const draft = (await client.query("SELECT * FROM content_versions WHERE document_id=$1 AND state='draft' ORDER BY version_number DESC LIMIT 1 FOR UPDATE", [doc.id])).rows[0];
    if (!draft) throw new ContentValidationError(['A draft is required before publishing']); if (Number(expectedVersion) !== Number(draft.version_number)) throw new ContentConflictError('Content changed since it was loaded', toContentVersion(draft));
    const version = Number((await client.query('SELECT COALESCE(MAX(version_number),0)+1 AS next FROM content_versions WHERE document_id=$1',[doc.id])).rows[0].next);
    await client.query("UPDATE content_versions SET state='superseded' WHERE document_id=$1 AND state IN ('draft','published')", [doc.id]);
    const result = await client.query(`INSERT INTO content_versions (document_id,version_number,state,base_version_number,payload,authored_by,authored_provider,published_by,published_at,change_summary) VALUES ($1,$2,'published',$3,$4,$5,$6,$7,NOW(),'Published announcement content') RETURNING *`, [doc.id,version,draft.version_number,draft.payload,draft.authored_by,draft.authored_provider,principal.subject]);
    await client.query('UPDATE content_documents SET published_version_id=$1,updated_at=NOW() WHERE id=$2',[result.rows[0].id,doc.id]); await client.query(`INSERT INTO content_audit_events (document_id,version_id,actor_subject,actor_provider,action,target_version) VALUES ($1,$2,$3,$4,'published',$5)`,[doc.id,result.rows[0].id,principal.subject,principal.provider,version]); await client.query('COMMIT'); return toContentVersion(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function discardContentDraft(pageKey, principal) { const doc=await contentDocument(pageKey); const draft=await getDraftContent(pageKey); if(!draft)return null; await getPostgresPool().query("UPDATE content_versions SET state='discarded' WHERE id=$1",[draft.id]); await getPostgresPool().query(`INSERT INTO content_audit_events (document_id,version_id,actor_subject,actor_provider,action,target_version) VALUES ($1,$2,$3,$4,'draft_discarded',$5)`,[doc.id,draft.id,principal.subject,principal.provider,draft.version]); return draft; }
async function listContentVersions(pageKey) { const doc=await contentDocument(pageKey); const result=await getPostgresPool().query('SELECT * FROM content_versions WHERE document_id=$1 ORDER BY version_number DESC',[doc.id]); return result.rows.map(toContentVersion); }
async function listContentAuditEvents(pageKey) { const doc=await contentDocument(pageKey); const result=await getPostgresPool().query('SELECT action, actor_subject AS "actorSubject", source_version AS "sourceVersion", target_version AS "targetVersion" FROM content_audit_events WHERE document_id=$1 ORDER BY id DESC',[doc.id]); return result.rows; }
async function restoreContentVersion(pageKey, versionId, principal, expectedVersion) { const doc=await contentDocument(pageKey); const result=await getPostgresPool().query('SELECT payload FROM content_versions WHERE id=$1 AND document_id=$2',[versionId,doc.id]); if(!result.rows[0])return null; return saveContentDraft(pageKey,result.rows[0].payload,principal,expectedVersion,'restored'); }

async function getPrincipalBySubject(subject, provider = 'development') {
  const result = await getPostgresPool().query(`SELECT u.id,u.email,u.display_name,u.is_active,u.provider,u.subject,r.role_key,p.permission_key FROM users u LEFT JOIN rbac_user_roles ur ON ur.user_id=u.id LEFT JOIN rbac_roles r ON r.id=ur.role_id LEFT JOIN rbac_role_permissions rp ON rp.role_id=r.id LEFT JOIN rbac_permissions p ON p.id=rp.permission_id WHERE u.provider=$1 AND u.subject=$2`, [provider, subject]);
  if (!result.rows.length) return null;
  return { provider: result.rows[0].provider, issuer: result.rows[0].provider === 'development' ? 'local.song-site' : 'entra', subject: result.rows[0].subject, userId: result.rows[0].id, displayName: result.rows[0].display_name, email: result.rows[0].email, roles: [...new Set(result.rows.map(row => row.role_key).filter(Boolean))], role: result.rows.find(row => row.role_key)?.role_key || null, permissions: [...new Set(result.rows.map(row => row.permission_key).filter(Boolean))], isActive: result.rows[0].is_active };
}

async function listRbacUsers() {
  const result = await getPostgresPool().query(`SELECT u.id,u.email,u.display_name AS "displayName",u.provider,u.subject,u.is_active AS "isActive",COALESCE(array_agg(DISTINCT r.role_key) FILTER (WHERE r.role_key IS NOT NULL),'{}') AS roles FROM users u LEFT JOIN rbac_user_roles ur ON ur.user_id=u.id LEFT JOIN rbac_roles r ON r.id=ur.role_id GROUP BY u.id ORDER BY u.display_name`);
  return result.rows;
}

async function assignRbacRoles(userId, roleKeys, actor) {
  const roles = [...new Set(roleKeys)];
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT role_key FROM rbac_roles WHERE role_key = ANY($1::text[])', [roles]);
    if (found.rowCount !== roles.length) { await client.query('ROLLBACK'); return null; }
    const user = await client.query('SELECT subject,provider FROM users WHERE id=$1', [userId]);
    if (!user.rows[0]) { await client.query('ROLLBACK'); return undefined; }
    await client.query('DELETE FROM rbac_user_roles WHERE user_id=$1', [userId]);
    for (const role of roles) await client.query('INSERT INTO rbac_user_roles (user_id,role_id,assigned_by) SELECT $1,id,$2 FROM rbac_roles WHERE role_key=$3', [userId, actor.subject, role]);
    await client.query('INSERT INTO authorization_audit_events (actor_subject,actor_provider,action,target_user_id,metadata) VALUES ($1,$2,$3,$4,$5)', [actor.subject, actor.provider, 'roles_replaced', userId, JSON.stringify({ roles })]);
    await client.query('COMMIT');
    return getPrincipalBySubject(user.rows[0].subject, user.rows[0].provider);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

module.exports = { createTask, getTasks, getProgress, updateTask, updateTaskStatus, getLeadership, updateLeadershipItem, getHomeSpotlight, updateHomeSpotlight, getAnnouncements, updateAnnouncement, getSongLinks, updateSongLink, getJourneyItems, updateJourneyItem, getPublishedContent, getDraftContent, previewContent, saveContentDraft, discardContentDraft, publishContent, listContentVersions, listContentAuditEvents, restoreContentVersion, getPrincipalBySubject, listRbacUsers, assignRbacRoles, close: closePostgresPool };
