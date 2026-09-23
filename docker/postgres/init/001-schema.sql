CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  task_type VARCHAR(30) NOT NULL CHECK (task_type IN ('journey', 'training')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  status VARCHAR(30) NOT NULL DEFAULT 'Not Started',
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

CREATE TABLE IF NOT EXISTS task_links (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  link_text VARCHAR(255) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (task_id, sort_order)
);

CREATE TABLE IF NOT EXISTS home_announcements (
  id BIGSERIAL PRIMARY KEY,
  icon VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
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
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section, sort_order)
);

CREATE TABLE IF NOT EXISTS leadership_sections (
  section_name VARCHAR(80) NOT NULL,
  item_id BIGINT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (section_name, item_id)
);

CREATE TABLE IF NOT EXISTS song_link_groups (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, sort_order)
);

INSERT INTO tasks (task_type, title, description, url, sort_order)
VALUES
  ('journey', 'Create CV', 'Create or update your CV.', '/my-cv', 1),
  ('journey', 'ATCP Song Skills Matrix', 'Track your skills.', '/skills-matrix', 2),
  ('training', 'TQ Training on Udacity', 'Complete the required training.', 'https://www.udacity.com/learning-plan/tq-at-accenture', 1)
ON CONFLICT DO NOTHING;

INSERT INTO leadership_members (section, member_name, title, initials, sort_order)
VALUES
  ('marketLeads', 'Erick Ona', 'ATCP Song Lead', 'EO', 1),
  ('marketLeads', 'Diane Cussay', 'Song EMEA and Americas', 'DC', 2),
  ('practiceLeads', 'Meikko Moritz', 'Commerce', 'MM', 1),
  ('enablementChampions', 'Noreena Lagmay', 'Talent Creation Lead', 'NL', 1)
ON CONFLICT DO NOTHING;

INSERT INTO leadership_sections (section_name, item_id, payload)
VALUES ('orgChart', 1, '{"id":1,"name":"Leadership Team","role":"Executive Leadership","parentId":null,"sortOrder":0}')
ON CONFLICT DO NOTHING;

INSERT INTO home_announcements (icon, title, body, sort_order)
VALUES ('notification', 'Important Trainings', 'Please complete the required training modules.', 1)
ON CONFLICT DO NOTHING;

INSERT INTO song_link_groups (title, sort_order)
VALUES ('Learn more about Song', 1)
ON CONFLICT DO NOTHING;

INSERT INTO song_links (group_id, title, description, link_text, url, sort_order)
SELECT id, 'ATCP Song Leadership', 'Leadership content', 'ATCP Song Leadership', '/atcp-song', 1
FROM song_link_groups WHERE sort_order = 1
ON CONFLICT DO NOTHING;
