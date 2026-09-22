CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Started',
  progress REAL NOT NULL DEFAULT 0,
  url TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL DEFAULT '',
  completed_at TEXT NOT NULL DEFAULT '',
  actual_duration TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  external_links TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS training_tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Started',
  progress REAL NOT NULL DEFAULT 0,
  url TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL DEFAULT '',
  completed_at TEXT NOT NULL DEFAULT '',
  actual_duration TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  external_links TEXT NOT NULL DEFAULT '[]'
);
