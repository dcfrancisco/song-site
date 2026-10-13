-- Normalized RBAC tables. Existing users.role remains for compatibility only.
CREATE TABLE IF NOT EXISTS rbac_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rbac_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permission_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rbac_role_permissions (
  role_id INTEGER NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES rbac_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS rbac_user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  assigned_by TEXT,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS authorization_audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_subject TEXT NOT NULL,
  actor_provider TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id TEXT,
  target_role_key TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_user ON rbac_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_role_permissions_role ON rbac_role_permissions(role_id);

INSERT OR IGNORE INTO rbac_roles (role_key, display_name) VALUES
  ('developer', 'Local Developer'), ('author', 'Content Author'),
  ('publisher', 'Content Publisher'), ('administrator', 'Administrator');

INSERT OR IGNORE INTO rbac_permissions (permission_key, display_name) VALUES
  ('content:announcement-page:edit', 'Edit announcement page'),
  ('content:announcement-page:publish', 'Publish announcement page'),
  ('content:history:read', 'Read content history'), ('content:restore', 'Restore content'),
  ('leadership:edit', 'Edit leadership'), ('leadership:publish', 'Publish leadership'),
  ('journey:read', 'Read Journey'), ('journey:manage', 'Manage Journey'),
  ('rbac:users:read', 'Read users'), ('rbac:users:manage', 'Manage user roles');

INSERT OR IGNORE INTO rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM rbac_roles r CROSS JOIN rbac_permissions p
WHERE (r.role_key = 'developer' AND p.permission_key IN ('content:announcement-page:edit', 'content:history:read', 'journey:read'))
   OR (r.role_key = 'author' AND p.permission_key IN ('content:announcement-page:edit', 'content:history:read', 'leadership:edit'))
   OR (r.role_key = 'publisher' AND p.permission_key IN ('content:announcement-page:edit', 'content:announcement-page:publish', 'content:history:read', 'content:restore', 'leadership:edit', 'leadership:publish'))
   OR (r.role_key = 'administrator');

INSERT OR IGNORE INTO users (id, external_id, email, display_name, role)
VALUES
  ('dev-developer', 'dev-developer', 'developer@local.song-site', 'Local Developer', 'developer'),
  ('dev-author', 'dev-author', 'author@local.song-site', 'Local Author', 'author'),
  ('dev-publisher', 'dev-publisher', 'publisher@local.song-site', 'Local Publisher', 'publisher'),
  ('dev-administrator', 'dev-administrator', 'administrator@local.song-site', 'Local Administrator', 'administrator');

INSERT OR IGNORE INTO rbac_user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN rbac_roles r ON r.role_key = u.role
WHERE u.id LIKE 'dev-%';