-- Relational tables shared by the SQLite and PostgreSQL database designs.
-- Existing SQLite task/content tables remain for API compatibility.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  external_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  link_text TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (task_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_task_links_task
  ON task_links (task_id, sort_order);

CREATE TABLE IF NOT EXISTS user_task_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Not Started',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date TEXT,
  end_date TEXT,
  started_at TEXT,
  completed_at TEXT,
  actual_duration_minutes INTEGER CHECK (actual_duration_minutes >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_user_task_progress_user
  ON user_task_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_status
  ON user_task_progress (user_id, status);

CREATE TABLE IF NOT EXISTS home_announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  icon TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS home_spotlights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT,
  full_name TEXT NOT NULL,
  certification TEXT,
  headshot_url TEXT,
  bio TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leadership_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL CHECK (section IN ('marketLeads', 'practiceLeads', 'capabilityLeads', 'enablementChampions')),
  category TEXT,
  subcategory TEXT,
  group_name TEXT,
  member_name TEXT NOT NULL,
  title TEXT,
  initials TEXT,
  photo_url TEXT,
  avatar_color TEXT,
  co_lead_name TEXT,
  co_lead_initials TEXT,
  co_lead_photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (section, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_leadership_members_section
  ON leadership_members (section, category, subcategory, sort_order);

CREATE TABLE IF NOT EXISTS song_link_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS song_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES song_link_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link_text TEXT NOT NULL,
  url TEXT NOT NULL,
  external_link INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (group_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_song_links_group
  ON song_links (group_id, sort_order);