# WP-042 Dashboard Management Hub

Status: In progress locally  
References: ADR-0038, ADR-0005, ADR-0015, ADR-0021  
Branch: `feature/dashboard-management-hub`

## Scope

Deliver the first management-hub slice for the bench project:

- Make `/dashboard` the management hub.
- Preserve the former spotlight and announcement experience at `/home`.
- Add an inherited-theme sidebar (site purple `#460073`) that collapses to glyph-only navigation and persists across tools: `/dashboard` is a layout route (`dashboard-shell.component`) whose children are the overview, `/dashboard/users`, `/dashboard/roles`, `/dashboard/resources` and `/dashboard/settings`. Legacy `/admin/users`, `/admin/roles` and `/settings` redirect to the child routes.
- Add server-derived dashboard identity and summary cards.
- Add current-data graphs for Journey and Training task status.
- Add User Management, Roles and Settings routes using existing backend session and RBAC boundaries; User Management in this slice is functional for profile/status administration, while roles and permissions remain deferred.
- Establish the future role-scoped dashboard contract: member self-scope, POC/lead team or cohort scope, and administrator platform scope.

## Non-goals

Permissions administration, onboarding workflow, onboarding assignment/cohort analytics, resource monitoring, audit lookup, templates, production Entra qualification, and full browser acceptance coverage are not part of this slice.

## Requirements and evidence

| Requirement | Evidence | Status |
|---|---|---|
| `/dashboard` is a management hub | `src/app/app.routes.ts`, `src/app/dashboard/dashboard.component.*` | Implemented locally |
| Legacy Home remains available | `/home` route and Navbar Home link | Implemented locally |
| Sidebar collapse is presentation-only | `dashboard-shell.component.ts` local storage preference | Implemented locally; verified in a browser (collapse to 78px, persists across tool navigation) |
| Glyphs have accessible names | Link labels remain in DOM when expanded; `title` is supplied when collapsed; toggle has `aria-label` and `aria-expanded` | Implemented locally; browser verification pending |
| Summary is server-derived | `backend/server.js`, both database adapters, OpenAPI path | Implemented locally |
| Current progress and status graphs use real stores | Journey tasks, training tasks and announcements are aggregated by both database adapters | Implemented locally |
| User access is backend-protected | Existing `auth.requirePermission('rbac:users:read')` route is consumed by the UI | Implemented locally |
| Permissions UI is deferred | ADR-0038 and SAD implementation update | Intentional boundary |

## API and database

The new `GET /api/v1/dashboard/summary` endpoint returns public-safe progress cards and status graphs without a session, plus identity and user/role cards when the server-resolved principal has the required permission. SQLite and PostgreSQL adapters implement the same contract. No migration is required because the summary reads existing task, announcement, user and role tables.

## Security

The frontend does not create a principal, select a role, or grant access. Public-safe aggregate cards may be returned without a session; member-specific and administrative cards require a server-resolved principal. User Management directory access is protected by `rbac:users:read`, and profile/status updates are protected by `rbac:users:manage`; role and permission administration remains deferred. Future member, POC/lead and administrator summaries must enforce ownership or cohort scope in the backend. Sidebar state is browser presentation state only.

## Verification and acceptance

- Backend test suite passes with loopback permissions: 14/14 tests.
- TypeScript application compilation passes with `npx tsc -p tsconfig.app.json --noEmit`.
- OpenAPI mutation parity tests pass as part of the backend suite.
- Angular production build is currently unverified: the process exits 134 after the existing Browserslist warning in this environment.
- Browser verification of collapse persistence, responsive layout, direct-route behavior and visual fidelity remains outstanding.

## Dependencies

Existing Development Mode session fixtures, RBAC tables and protected `/api/v1/rbac/users` endpoint. WP-043 remains the dependency for a real onboarding destination; it is not faked by this package.

## Definition of Done

This package is not complete until Angular production build/resource failure is resolved, browser acceptance tests cover the shell, and direct-route/API authorization behavior is verified against the disposable local backend.
