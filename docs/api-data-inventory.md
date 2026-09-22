# API and Data Inventory

This is the current site review as of 2026-09-18. It distinguishes existing APIs from the APIs needed for the target architecture.

## Existing APIs

The current Express API is mounted from `backend/server.js` at `http://localhost:5001`.

| Area | Existing endpoints | Current storage |
| --- | --- | --- |
| Journey tasks | `GET/POST /api/tasks`, `PUT /api/tasks/:id`, `PUT /api/tasks/:id/status`, `GET /api/progress-status` | SQLite locally, populated by migration `004-content-data.sql` |
| Training | `GET/POST /api/training-tasks`, `PUT /api/training-tasks/:id`, `PUT /api/training-tasks/:id/status`, `GET /api/training-progress-status` | SQLite locally, populated by migration `004-content-data.sql` |
| Leadership | `GET/PUT /api/leadership/:section/:id` | SQLite `leadership_sections`, populated by migration `004-content-data.sql` |
| Home | `GET/PUT /api/home/spotlight`, `GET/PUT /api/home/announcements/:id` | SQLite `home_spotlight`, `home_spotlight_people`, and `announcements`, populated by migration `004-content-data.sql` |
| Links | `GET/PUT /api/song-links/:sectionId/:cardId` | SQLite `song_link_sections` and `song_link_cards`, populated by migration `004-content-data.sql` |
| Classic Journey items | `GET /api/journey/items`, `PUT /api/journey/items/:id` | SQLite `journey_items` and `journey_statuses`, populated by migration `004-content-data.sql`; frontend writes still use `localStorage` |

The Angular frontend also uses browser `localStorage` for the classic `/journey` screen. That state is not synchronized with the backend and must be resolved before the classic Journey is treated as a shared product workflow.

The former duplicate JSON server in `public/server.js` on port 5000 has been removed. The repository now has one backend runtime for these APIs.

## Audit gaps

The current API is a working local slice, not a production-ready service. The following are tracked under `WP-018`:

- mutation routes use basic validation and a temporary non-development API-key gate, but do not yet enforce identity-backed authentication or authorization;
- the classic Journey UI does not call the Journey item update endpoint, so shared status changes are not yet durable;
- OpenAPI now describes the implemented compatibility routes, but response schemas and contract parity still need broader coverage;
- database lifecycle commands still initialize through the repository module; `.env` is now loaded before resolving `DATABASE_PATH`;
- backend automated test coverage is currently zero tests;
- the GitHub Pages frontend has no hosted backend and requires an externally reachable `VITE_API_BASE_URL`.

## APIs needed

New APIs should be added to the OpenAPI contract under `/api/v1` while the current `/api/*` endpoints remain compatibility routes during migration.

### Identity and access

- `GET /api/v1/me`
- `GET /api/v1/users/:userId`
- `GET /api/v1/users/:userId/roles`
- `GET /api/v1/roles`
- `GET /api/v1/permissions`
- `PUT /api/v1/users/:userId/roles`

### Journey and work packages

- `GET /api/v1/journeys`
- `POST /api/v1/journeys`
- `GET /api/v1/journeys/:journeyId`
- `GET /api/v1/journeys/:journeyId/work-packages`
- `POST /api/v1/journeys/:journeyId/work-packages`
- `GET /api/v1/work-packages/:workPackageId`
- `PUT /api/v1/work-packages/:workPackageId`
- `GET /api/v1/work-packages/:workPackageId/tasks`
- `POST /api/v1/work-packages/:workPackageId/tasks`
- `PUT /api/v1/tasks/:taskId/status`
- `GET /api/v1/tasks/:taskId/status-history`
- `GET /api/v1/journeys/:journeyId/progress`

### Content and operations

- `GET /api/v1/home/spotlight`
- `GET /api/v1/home/announcements`
- `GET /api/v1/leadership`
- `GET /api/v1/song-links`
- `GET /api/v1/training-catalog`
- `POST/PUT /api/v1/announcements` for authorized content managers
- `POST/PUT /api/v1/leadership` for authorized content managers

## Proposed tables

### Identity and RBAC

- `users`: internal user identity, stable external subject/EID, display profile, active state.
- `user_identities`: provider, issuer, subject, and last-seen metadata.
- `roles`: `member`, `lead`, `admin`, plus future roles.
- `permissions`: permission keys such as `journey:read` and `status:update-own`.
- `user_roles`: user-to-role assignments with scope and timestamps.
- `role_permissions`: role-to-permission assignments.

### User profile and employee data

- `user_profiles`: preferred name, photo, location, market, practice, capability, and availability.
- `contact_details`: primary and emergency contact records with visibility rules.
- `user_roles_and_skills`: normalized user-to-role and user-to-skill relationships.
- `skills`: canonical skill names, categories, and levels.
- `competencies`: competency definitions and descriptions.
- `user_competencies`: user assessments, proficiency, evidence, and assessment timestamps.
- `cvs`: user CV metadata and current version.
- `cv_entries`: experience, role, technology, project, and achievement entries.

### Journey domain

- `journeys`: owner/team scope, title, lifecycle state, and timestamps.
- `work_packages`: journey, title, description, assignment, ordering, and lifecycle state.
- `tasks`: work package, title, description, link, status, progress, assignment, and timestamps.
- `task_links`: normalized external and internal links associated with tasks.
- `status_history`: immutable actor, previous status, new status, reason, and timestamp.
- `training_items`: reusable training catalog entries and external references.
- `task_training_items`: relationship between Journey tasks and training items.
- `journey_views`: classic Journey cards, routes, labels, images, and display ordering, if the classic screen remains supported.
- `journey_progress`: calculated or snapshot progress by journey, work package, and task.

### Workday, compliance, and assets

- `workday_profiles`: people lead, priorities, contact-sync state, and external employee reference.
- `workday_updates`: requested change, submitted value, status, actor, and completion timestamp.
- `compliance_items`: required compliance activity and due-date policy.
- `compliance_records`: user completion, evidence link, verifier, and verification timestamp.
- `assets`: asset identity, category, serial/reference, and ownership.
- `asset_assignments`: user-to-asset assignment history, dates, and return state.

### Managed content

- `spotlight_items`: headline and spotlight metadata.
- `spotlight_people`: people shown in a spotlight item.
- `announcements`: title, body, icon, publication window, and author.
- `leadership_groups`: market, practice, capability, and enablement groupings.
- `leadership_people`: person profile and leadership role.
- `song_link_sections`: named link groups.
- `song_links`: links belonging to a section with internal/external classification.

### Organization and reference data

- `organizations`: business organization or ATCP Song group.
- `markets`: regional market definitions.
- `practices`: practice definitions within an organization.
- `capabilities`: capability definitions within a practice.
- `people`: canonical directory profiles used by leadership and enablement content.
- `leadership_assignments`: person-to-market, practice, capability, or enablement role assignments.
- `external_resources`: canonical external systems and links such as Workday, training providers, and internal portals.

### Platform concerns

- `audit_events`: security and administrative actions, separate from task status history.
- `migration_runs`: applied migration version and execution metadata.

The complete list is intentionally broader than the current SQLite migrations. The current migrations contain task-compatible tables and a compatibility content slice; `WP-014` must turn this inventory into bounded normalized migrations based on confirmed product ownership and workflow requirements.

## Required constraints

- Every user-owned record must have an explicit ownership or team-scope rule.
- Status values must use a controlled vocabulary and transition policy.
- Deletes for user activity and status history should be restricted or soft-deleted.
- Foreign keys and unique constraints must be tested in PostgreSQL and SQLite.
- API response schemas must be represented in OpenAPI before implementation.
- No mutation endpoint is production-ready until authentication, authorization, input validation, and negative tests are present.
