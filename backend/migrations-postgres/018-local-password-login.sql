ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email));

-- The initial administrator has no password here. The backend sets it once from the
-- DEFAULT_ADMIN_PASSWORD secret at startup (AUTH_MODE=local) and never overwrites it afterwards.
INSERT INTO users (id, email, display_name, role, provider, subject, is_active)
VALUES ('00000000-0000-4000-8000-0000000000a1', 'dcfran@gmail.com', 'Danny Francisco', 'administrator', 'local', '00000000-0000-4000-8000-0000000000a1', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO rbac_user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 'migration'
FROM users u JOIN rbac_roles r ON r.role_key = 'administrator'
WHERE u.provider = 'local' AND lower(u.email) = 'dcfran@gmail.com'
ON CONFLICT DO NOTHING;
