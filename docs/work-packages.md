# Work Package Tracking

This inventory records what is already present in the repository and connects it to the architecture decisions. `Implemented` means code exists today; it does not mean the area is production-ready.

## Tags

- `WP-*`: work package identifier.
- `ADR-*`: architecture decision that governs the work.
- `Implemented`: visible code exists in the current repository.
- `In progress`: implementation exists but the target architecture is incomplete.
- `Planned`: not implemented yet.
- `ADR complete`: the decision is documented and accepted; it does not imply the work package is complete.

## Current inventory

| Tag | Area | Evidence | Owner | Status | ADR status |
| --- | --- | --- | --- | --- | --- |
| `WP-001` | Journey navigation and landing experience | `/journey`, Journey components under `src/app/song-bench/journey` | `danny.c.francisco` | Implemented; assigned to `danny.c.francisco` | `ADR-0001` complete |
| `WP-002` | My Journey task experience | `/my-journey`, task grid, task detail components, task service | `danny.c.francisco` | Implemented; API exists but authentication, authorization, and production tests are pending | `ADR-0006`, `ADR-0017` |
| `WP-003` | Training Tracker | `/training-tracker`, training task service and components | `danny.c.francisco` | Implemented; training records are migration-backed through the database API; authentication and production tests remain pending | `ADR-0006` complete for domain direction |
| `WP-004` | Existing task API | Express routes for tasks, training tasks, progress, and status updates | `danny.c.francisco` | Implemented locally; mutation authorization, validation, and integration tests pending | `ADR-0001`, `ADR-0017` |
| `WP-005` | OpenAPI contract | `docs/openapi/song-site.yaml` | `danny.c.francisco` | In progress; temporary content mutation routes are documented, response schemas and full parity remain pending | `ADR-0002`, `ADR-0010`, `ADR-0017` |
| `WP-006` | Database persistence | SQLite migrations and repository-backed task API | `danny.c.francisco` | In progress; SQLite local complete, PostgreSQL connection check implemented, adapter and production integration pending under `WP-017` | `ADR-0003`, `ADR-0004`, `ADR-0010`, `ADR-0013`, `ADR-0016`, `ADR-0026` |
| `WP-007` | RBAC | Roles and permissions for Journey operations | `danny.c.francisco` | Planned | `ADR-0005` documented |
| `WP-008` | Work Package and status history model | Explicit work packages, transitions, and audit history | `danny.c.francisco` | Planned | `ADR-0006` documented |
| `WP-009` | Frontend verification | Unit tests, production build, and Playwright Journey flows | `danny.c.francisco` | In progress | `ADR-0007`, `ADR-0008` complete |
| `WP-010` | Local Swagger UI | Swagger UI for `docs/openapi/song-site.yaml` in development only | `danny.c.francisco` | Completed and verified; production route returns 404 | `ADR-0002`, `ADR-0009`, `ADR-0010` complete |
| `WP-011` | Site API and relational data model | Existing API inventory, target API boundaries, PostgreSQL/SQLite table model | `danny.c.francisco` | In progress; current content APIs and temporary writes use SQLite, target domain model and PostgreSQL remain pending | `ADR-0011`, `ADR-0014` |
| `WP-012` | Backend surface consolidation | Retire or migrate the duplicate `public/server.js` JSON server | `danny.c.francisco` | Completed; obsolete port 5000 server removed | `ADR-0001`, `ADR-0011` complete |
| `WP-013` | Environment-driven configuration | API URL, backend runtime settings, Swagger mode, and identity configuration from environment variables | `danny.c.francisco` | In progress; API configuration migrated, identity fallback cleanup pending | `ADR-0001`, `ADR-0005` |
| `WP-014` | Complete domain data model | Journey, profile, work, training, content, organization, and audit tables | `danny.c.francisco` | In progress; current content slice and migration-backed records implemented, complete domain schema pending | `ADR-0011`, `ADR-0012`, `ADR-0014` |
| `WP-015` | Local database lifecycle | `db:migrate`, migration-backed compatibility `db:seed`, `db:check`, destructive `db:reset`, and PostgreSQL connectivity check | `danny.c.francisco` | In progress; SQLite lifecycle is complete and `db:postgres:check` is available, PostgreSQL migration lifecycle remains pending | `ADR-0004`, `ADR-0013`, `ADR-0026` |
| `WP-016` | User administration | Admin landing page, user directory, user detail, role assignment, and user lifecycle actions | `danny.c.francisco` | Planned; no admin route, UI, user API, or RBAC enforcement exists yet | `ADR-0005`, `ADR-0015` complete |
| `WP-017` | PostgreSQL production integration | PostgreSQL adapter, portable migrations, deployment configuration, CI parity, and cutover verification | `danny.c.francisco` | In progress; `DB_DRIVER` settings, pooled `DATABASE_URL` connection, and `db:postgres:check` exist, but repository adapter, portable migrations, CI, and deployment cutover remain pending | `ADR-0003`, `ADR-0004`, `ADR-0016`, `ADR-0026` |
| `WP-018` | API hardening and production readiness | Authorization, Journey persistence, OpenAPI parity, database lifecycle correctness, automated tests, and deployment API readiness | `danny.c.francisco` | In progress; mutation routes have basic payload/ID validation and a temporary non-development API-key gate; identity-backed authorization, audit, tests, and deployment readiness remain pending | `ADR-0002`, `ADR-0004`, `ADR-0005`, `ADR-0007`, `ADR-0017` complete |
| `WP-019` | Production hosting and API topology decision | Select backend/database hosting, environments, API origin, CORS, secrets, and full-stack deployment ownership | To be assigned | Planned; owner review required before production deployment work | `ADR-0018` proposed |
| `WP-020` | Identity and access lifecycle decision | Confirm identity authority, token validation, claim mapping, provisioning, deprovisioning, and admin recovery | To be assigned | Planned; owner review required before RBAC or user administration implementation | `ADR-0019` proposed |
| `WP-021` | Data protection and retention decision | Classify employee data, define visibility, retention, deletion, export, residency, and audit protections | To be assigned | Planned; owner and privacy review required before expanding user data schema | `ADR-0020` proposed |
| `WP-022` | Operations and reliability decision | Define SLOs, RTO/RPO, health checks, observability, backups, restore tests, alerting, and incident ownership | To be assigned | Planned; owner review required before PostgreSQL production promotion | `ADR-0021` proposed |
| `WP-023` | API lifecycle and compatibility decision | Define versioning, compatibility-route retirement, error envelope, pagination, rate limits, and contract ownership | To be assigned | Planned; owner review required before expanding `/api/v1` | `ADR-0022` proposed |
| `WP-024` | Announcement domain and content management decision | Decide whether dashboard announcements and the dedicated Announcement page share a managed domain, then define ownership, publication, authorization, migration, and audit rules | To be assigned | In progress; temporary database update API, payload validation, and non-development API-key gate exist; domain decision and production content-management controls remain open | `ADR-0023` proposed |
| `WP-025` | Legacy JSON data migration and source-of-truth governance | Formalize migration lifecycle for tasks, training, links, home, and leadership data; prevent runtime JSON reads and silent overwrites; verify SQLite/PostgreSQL parity | To be assigned | In progress; migration `004-content-data.sql` is the local source, all legacy backend JSON files and runtime dependencies were removed, and local counts were verified; PostgreSQL parity and governance remain pending | `ADR-0024` proposed |
| `WP-026` | Structured asset data and binary storage strategy | Migrate structured records into database-owned domains, define media metadata, and select durable production storage for images and attachments | To be assigned | In progress; Journey structured records are migration-backed and binaries remain external; metadata and production storage decision remain pending | `ADR-0025` proposed |
| `WP-027` | ATCP Song data stub reconciliation | Retire the unused ATCP Song fixture and remove duplicate runtime candidates | `danny.c.francisco` | Completed; unused fixture and stale JSON-reading backup were removed, and the active ATCP Song page uses `GET /api/leadership` | `ADR-0011`, `ADR-0014`, `ADR-0025` |
| `WP-028` | Leadership Organizational Chart | Define and implement the org-chart presentation, API contract, persistence mapping, and authorized leadership data-entry experience on the existing leadership foundation | To be assigned | In progress; backend compatibility CRUD, PostgreSQL table support, OpenAPI paths, and focused repository/API-service tests are present; org-chart FED UI, SSO-compatible RBAC, audit, and full production test/CI gates remain pending | `ADR-0027`, `ADR-0029`, `ADR-0014`, `ADR-0017`, `ADR-0025` |
| `WP-029` | PostgreSQL Compatibility, Test Layers, and CI Gates | Establish PostgreSQL 14+ with pgvector as the production baseline, define local database options, and implement frontend unit, backend unit/integration, Playwright FED, migration, and deployment CI gates | To be assigned | In progress; optional production-like Compose stack, PostgreSQL 14/pgvector initialization, backend/frontend images, and Dev Container configuration are present; automated PostgreSQL integration CI, Playwright CI, and production deployment cutover remain pending | `ADR-0028`, `ADR-0007`, `ADR-0008`, `ADR-0016`, `ADR-0017`, `ADR-0026` |
| `WP-030` | SSO-Compatible Leadership Authorization | Preserve Microsoft Entra SSO while implementing guest navigation, authenticated user permissions, leadership/org-chart editor access, backend authorization, audit, and negative tests | To be assigned | Planned; SSO exists in the frontend, but backend token validation, role/permission mapping, leadership editor authorization, audit, and guest-versus-editor tests are not implemented | `ADR-0029`, `ADR-0005`, `ADR-0019`, `ADR-0017` |

## Definition of complete

A work package is complete only when its OpenAPI contract, implementation, migration (if applicable), authorization rules, automated tests, and runbook are present. Existing UI or JSON endpoints alone are not sufficient.

## Next sequence

1. Complete `WP-018` security, contract, persistence, lifecycle, and verification gates before calling the local API production-ready.
2. Confirm the Journey resource and Work Package vocabulary with the requester.
3. Implement the API contract without changing the existing UI behavior.
4. Add PostgreSQL production support and verify parity with migration-backed local data.
5. Add RBAC enforcement and negative authorization tests.
6. Add Playwright configuration and critical Journey workflows under `WP-009`.
7. Keep the completed local-only Swagger UI covered by a production-exclusion smoke test.
8. Decide the target API/table inventory and expand the current content tables into the normalized domain model under `WP-011`.
9. Keep the single-backend runtime boundary covered by deployment and smoke tests.
10. Complete environment-driven identity configuration and remove remaining hardcoded authentication fallbacks under `WP-013`.
11. Confirm and implement the complete domain table model under `WP-014` before expanding the production API.
12. Add PostgreSQL equivalents and CI coverage for the database lifecycle under `WP-006` and `WP-015`.
13. Add authenticated content writes, OpenAPI response schemas, and PostgreSQL migrations for the content tables under `WP-011` and `WP-014`.
14. Define and implement the admin/users API and landing page under `WP-016`, after identity and RBAC foundations are available.
15. Implement PostgreSQL integration under `WP-017`: adapter, migrations, CI service, deployment secrets, backup, and rollback/forward-fix runbook.
16. Do not promote the static GitHub Pages frontend until an externally reachable API is configured and smoke-tested under `WP-018`.
17. Review and resolve `ADR-0018` through `ADR-0022` before assigning production implementation work that depends on those decisions.
18. Review and resolve `ADR-0023` before expanding the temporary announcement update API or treating the dedicated Announcement page as database-backed.
19. Review and resolve `ADR-0024` before introducing any future import or production data-management process.
20. Review and resolve `ADR-0025` before exposing remaining asset fixtures as production APIs or adding managed binary uploads.
21. Keep `WP-027` closed; active ATCP Song data remains owned by the database-backed leadership API.
22. Review and resolve `ADR-0027` before implementing the Leadership Organizational Chart under `WP-028`.
23. Review and resolve `ADR-0028` before treating SQLite checks, frontend tests, or deployment success as production compatibility evidence.
24. Review and resolve `ADR-0029` before enabling leadership or org-chart maintenance for production users.
