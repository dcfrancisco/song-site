const { getPostgresPool, closePostgresPool } = require('./postgres');

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
  const result = await getPostgresPool().query('SELECT * FROM leadership_members WHERE is_active = TRUE ORDER BY section, sort_order');
  const data = {};
  for (const row of result.rows) (data[row.section] ||= []).push({ id: Number(row.id), name: row.member_name, role: row.title, category: row.category, initials: row.initials, photo: row.photo_url, avatarColor: row.avatar_color, ...(row.co_lead_name ? { coLead: { name: row.co_lead_name, initials: row.co_lead_initials, photo: row.co_lead_photo_url } } : {}) });
  return data;
}

async function updateLeadershipItem(section, id, payload) {
  const result = await getPostgresPool().query('UPDATE leadership_members SET member_name = COALESCE($1, member_name), title = COALESCE($2, title), initials = COALESCE($3, initials), photo_url = COALESCE($4, photo_url), updated_at = NOW() WHERE section = $5 AND id = $6', [payload.name, payload.role, payload.initials, payload.photo, section, id]);
  return result.rowCount > 0;
}

async function getLeadershipOrgChart() {
  const result = await getPostgresPool().query(
    "SELECT payload FROM leadership_sections WHERE section_name = 'orgChart' ORDER BY item_id"
  );
  return result.rows.map((row) => row.payload);
}

async function createLeadershipOrgChartNode(payload) {
  const nextIdResult = await getPostgresPool().query(
    "SELECT COALESCE(MAX(item_id), 0) + 1 AS next_id FROM leadership_sections WHERE section_name = 'orgChart'"
  );
  const id = Number(nextIdResult.rows[0].next_id);
  await getPostgresPool().query(
    `INSERT INTO leadership_sections (section_name, item_id, payload)
     VALUES ('orgChart', $1, $2)`,
    [id, { ...payload, id }]
  );
  return { ...payload, id };
}

async function updateLeadershipOrgChartNode(id, payload) {
  const result = await getPostgresPool().query(
    "UPDATE leadership_sections SET payload = $1 WHERE section_name = 'orgChart' AND item_id = $2",
    [{ ...payload, id: Number(id) }, id]
  );
  return result.rowCount > 0 ? { ...payload, id: Number(id) } : null;
}

async function deleteLeadershipOrgChartNode(id) {
  const result = await getPostgresPool().query(
    "DELETE FROM leadership_sections WHERE section_name = 'orgChart' AND item_id = $1",
    [id]
  );
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

module.exports = { createTask, getTasks, getProgress, updateTask, updateTaskStatus, getLeadership, updateLeadershipItem, getLeadershipOrgChart, createLeadershipOrgChartNode, updateLeadershipOrgChartNode, deleteLeadershipOrgChartNode, getHomeSpotlight, updateHomeSpotlight, getAnnouncements, updateAnnouncement, getSongLinks, updateSongLink, getJourneyItems, updateJourneyItem, close: closePostgresPool };
