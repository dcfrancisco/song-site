const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const config = require("./config");

if (config.databaseDriver === "postgres") {
  throw new Error("DB_DRIVER=postgres is configured, but the PostgreSQL repository adapter is not implemented yet");
}

const databasePath = config.databasePath;
const migrationsPath = path.join(__dirname, "migrations");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
for (const migrationFile of fs.readdirSync(migrationsPath).filter((file) => file.endsWith(".sql")).sort()) {
  database.exec(fs.readFileSync(path.join(migrationsPath, migrationFile), "utf8"));
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

module.exports = {
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
  close: () => database.close()
};
