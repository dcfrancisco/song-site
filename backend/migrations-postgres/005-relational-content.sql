CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  task_type VARCHAR(30) NOT NULL CHECK (task_type IN ('journey', 'training')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  status VARCHAR(30) NOT NULL DEFAULT 'Not Started'
    CHECK (status IN ('Not Started', 'Pending', 'In Progress', 'Completed')),
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date DATE,
  end_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER CHECK (actual_duration_minutes >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_type_order ON tasks (task_type, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_type_order ON tasks (task_type, sort_order);

CREATE TABLE IF NOT EXISTS task_links (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  link_text VARCHAR(255) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_task_links_task ON task_links (task_id, sort_order);

CREATE TABLE IF NOT EXISTS user_task_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'Not Started'
    CHECK (status IN ('Not Started', 'Pending', 'In Progress', 'Completed')),
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date DATE,
  end_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER CHECK (actual_duration_minutes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_user_task_progress_user ON user_task_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_status ON user_task_progress (user_id, status);

CREATE TABLE IF NOT EXISTS home_announcements (
  id BIGSERIAL PRIMARY KEY,
  icon VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS home_spotlights (
  id BIGSERIAL PRIMARY KEY,
  display_name VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  certification VARCHAR(255),
  headshot_url TEXT,
  bio TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leadership_members (
  id BIGSERIAL PRIMARY KEY,
  section VARCHAR(40) NOT NULL CHECK (section IN ('marketLeads', 'practiceLeads', 'capabilityLeads', 'enablementChampions')),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  group_name VARCHAR(255),
  member_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  initials VARCHAR(10),
  photo_url TEXT,
  avatar_color VARCHAR(32),
  co_lead_name VARCHAR(255),
  co_lead_initials VARCHAR(10),
  co_lead_photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_leadership_members_section
  ON leadership_members (section, category, subcategory, sort_order);

CREATE TABLE IF NOT EXISTS song_link_groups (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS song_links (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES song_link_groups(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link_text VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  external_link BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_song_links_group ON song_links (group_id, sort_order);