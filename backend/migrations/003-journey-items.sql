CREATE TABLE IF NOT EXISTS journey_statuses (
  status TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS journey_items (
  id INTEGER PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  route TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Started',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  last_updated TEXT NOT NULL DEFAULT '',
  is_expanded INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (status) REFERENCES journey_statuses(status)
);