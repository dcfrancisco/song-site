INSERT OR IGNORE INTO users (id, external_id, email, display_name, role)
VALUES ('user-dcfran', 'user-dcfran', 'dcfran@gmail.com', 'Danny Francisco', 'administrator');

INSERT OR IGNORE INTO rbac_user_roles (user_id, role_id)
SELECT 'user-dcfran', id FROM rbac_roles WHERE role_key = 'administrator';
