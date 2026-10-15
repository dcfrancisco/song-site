-- Keep PostgreSQL role bundles aligned with the backend-owned development fixtures
-- and the equivalent SQLite RBAC migration.
INSERT INTO rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE (r.role_key = 'developer' AND p.permission_key IN (
  'content:announcement-page:edit', 'content:history:read', 'journey:read', 'journey:manage'
))
   OR (r.role_key = 'author' AND p.permission_key IN (
  'content:announcement-page:edit', 'content:history:read', 'leadership:edit', 'journey:manage'
))
   OR (r.role_key = 'publisher' AND p.permission_key IN (
  'content:announcement-page:edit', 'content:announcement-page:publish', 'content:history:read',
  'content:restore', 'leadership:edit', 'leadership:publish', 'journey:manage'
))
ON CONFLICT DO NOTHING;
