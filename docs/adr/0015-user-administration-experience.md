# ADR-0015: User Administration Experience

- Status: Accepted as planned
- Date: 2026-09-18
- Owner: `danny.c.francisco`

## Context

The site has no dedicated user-administration landing page. It has no `/admin` or `/users` route, user directory UI, user CRUD API, user tables, or server-side RBAC enforcement. The existing “Admin Rights” wording belongs to a workstation-compliance task and is not a site administration feature.

## Decision

Create a separate admin experience for authorized administrators rather than mixing user management into the leadership or general contact pages.

The planned surface is:

- `/admin/users`: protected user administration landing page;
- `GET /api/v1/users`: searchable and filterable user directory;
- `GET /api/v1/users/:userId`: user detail;
- `PUT /api/v1/users/:userId`: permitted profile and active-state updates;
- `GET /api/v1/users/:userId/roles`: assigned roles;
- `PUT /api/v1/users/:userId/roles`: role assignment for authorized administrators.

The backend must enforce the `user:manage` permission. Angular route guards can hide navigation, but they are not a security boundary. Role assignment and account-state changes must be audited and must not permit an administrator to remove their own final administrative access without an explicit recovery process.

The feature depends on the identity model and permission-based RBAC defined by ADR-0005. The initial roles remain `member`, `lead`, and `admin` until confirmed with stakeholders.

## Consequences

User administration has a clear landing page and API boundary separate from leadership, points of contact, and contact-us workflows. It requires authenticated identity claims, `users`, `user_identities`, `roles`, `permissions`, `user_roles`, and audit storage before implementation can be production-ready.

## Non-goals for the first slice

- It will not replace the identity provider.
- It will not expose unrestricted user data to ordinary members.
- It will not treat workstation or device administrator rights as application roles.
- It will not be marked implemented until the route, API, database migration, authorization checks, and negative tests exist.

## 2026-10-13 assessment amendment (status unchanged)

Development identities defined by `ADR-0035` are fixtures, not production users. `/admin/users` must not create, edit, assign roles to, or promote development fixtures, and development fixtures must never be synchronized into a production identity store.

The user-administration design depends on normalized `roles`, `permissions`, `user_roles`, and `role_permissions`; the current single `users.role` column in `backend/migrations/005-relational-content.sql` and `backend/migrations-postgres/005-relational-content.sql` does not implement this ADR. Authoring roles and page-scoped permissions must use the same backend assignment model after stakeholder approval.

Admin bootstrap and final-administrator recovery remain production decisions. Development Mode may exercise those flows with isolated test data, but it is not a production break-glass path and must not establish production authorization policy.
