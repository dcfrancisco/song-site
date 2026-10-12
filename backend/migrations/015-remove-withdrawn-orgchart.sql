CREATE TABLE IF NOT EXISTS withdrawn_orgchart_records (
  section_name TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  payload TEXT NOT NULL,
  archived_at TEXT NOT NULL,
  PRIMARY KEY (section_name, item_id)
);
INSERT OR IGNORE INTO withdrawn_orgchart_records (section_name, item_id, payload, archived_at)
SELECT section_name, item_id, payload, datetime('now') FROM leadership_sections WHERE section_name = 'orgChart';
DELETE FROM leadership_sections WHERE section_name = 'orgChart';
