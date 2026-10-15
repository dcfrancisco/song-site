INSERT INTO rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.role_key IN ('developer', 'author', 'publisher')
  AND p.permission_key = 'journey:manage'
ON CONFLICT DO NOTHING;
