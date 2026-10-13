# Song Site ADR Gap Analysis

- Review date: 2026-10-13
- Scope: all 34 ADRs present before this review (`ADR-0001` through `ADR-0034`), work packages, Angular application, Express API, OpenAPI, SQLite/PostgreSQL migrations, tests, and CI/CD
- Review type: repository evidence review; no production/tenant claims were independently verified

## 1. Executive summary

The repository has useful architecture direction and a functioning Angular/Express/database development slice, but it does not yet have an authenticated authorization boundary or authoring lifecycle. The highest-risk verified behavior is in `backend/server.js`: every mutation is allowed when `NODE_ENV` is anything other than `production`; in production, a shared `X-Admin-Key` is the only write control. `Skip SSO` in `src/app/index/index.component.ts` only navigates to the dashboard and does not establish a backend identity.

The product can proceed without organizational Entra access if local identity is implemented as a server-controlled Development Mode with startup isolation and the same backend permission checks intended for production. Entra remains the Production Mode provider and is not replaced. The recommended authoring model is a shared lifecycle/security/version framework with page-specific schemas and editors, beginning with the dedicated Announcement page and then grouped leadership content.

This review found three Critical architecture gaps and multiple High gaps:

- **Critical — fail-open non-production mutations:** `requireTemporaryContentWriteAccess` bypasses all authentication outside `NODE_ENV=production` (`backend/server.js`).
- **Critical — no production API identity/RBAC:** the frontend requests only OIDC identity scopes and the backend has no bearer-token verifier, principal resolution, permission middleware, or ownership enforcement (`src/app/auth/auth.service.ts`, `backend/server.js`).
- **Critical — withdrawn org-chart decision conflicts with code:** `ADR-0027` withdraws the feature, but runtime CRUD, repositories, PostgreSQL seed data, and tests remain (`backend/server.js`, `backend/database.js`, `backend/postgres-database.js`, `docker/postgres/init/001-schema.sql`, `backend/database.test.js`).
- **High — contract drift:** OpenAPI omits four live org-chart operations and leaves several mutation bodies as unrestricted objects (`docs/openapi/song-site.yaml`).
- **High — no authoring lifecycle:** current writes update live content directly; drafts, preview, immutable versions, attribution, recovery, and conflict handling do not exist.
- **High — persistence drift:** migrations have no ledger; SQLite applies every SQL file on module import; PostgreSQL initialization duplicates schema/seed responsibilities; compatibility and normalized tables coexist without one declared runtime source.
- **High — verification gaps:** backend tests cover only two SQLite leadership cases; most frontend specs are component-creation checks; no Playwright configuration/script is committed; the image workflow publishes but does not deploy.

Documentation produced by this review is planning evidence only. It does not implement Development Mode, authorization, authoring, Entra integration, or deployment.

## Review notation

- **Verified:** directly observed in repository code/configuration or command output.
- **Assumption:** a reasonable design inference that requires validation.
- **Approval:** a product, security, privacy, operations, or organizational decision that the repository cannot make.
- Severity uses **Critical**, **High**, **Medium**, and **Low** based on current risk and architectural blocking impact, not feature desirability.

## 2. ADR inventory and coverage matrix

Every ADR below includes its decision/status, implementation evidence, missing decisions/requirements, conflicts, security/authorization, API/database, testing, corrective action, and work-package mapping.

### ADR-0001 — Architecture Baseline — High

- **Decision/status:** Accepted modular Angular/Express/versioned-API/relational/backend-authorization direction.
- **Evidence (Verified):** Angular routes exist in `src/app/app.routes.ts`; Express is in `backend/server.js`; SQLite and PostgreSQL adapters exist in `backend/database.js` and `backend/postgres-database.js`.
- **Missing/conflicts:** no `/api/v1` implementation, authenticated backend boundary, explicit work-package model, or complete relational domain; current compatibility APIs dominate.
- **Security:** backend authorization requirement is unmet; Angular has no guards and Skip SSO is navigation only.
- **API/database:** relational slices exist, but duplicate compatibility/normalized content tables and two divergent adapters remain.
- **Testing:** no architecture-boundary or route-security inventory test.
- **Action/WP:** retain the baseline; execute `WP-036`, `WP-037`, and existing `WP-018`; do not mark the baseline fully realized.

### ADR-0002 — OpenAPI-First API Design — High

- **Decision/status:** Accepted; OpenAPI is intended as source of truth.
- **Evidence (Verified):** `docs/openapi/song-site.yaml` parses and documents most compatibility routes.
- **Missing/conflicts:** live org-chart routes are absent; several path parameters are undeclared; mutation schemas use `additionalProperties: true`; runtime request validation is manual and partial.
- **Security:** security scheme describes a temporary key, not identity/RBAC; `401`/`403` responses are mostly absent.
- **API/database:** no versioned authoring/session contracts or generated/runtime validation.
- **Testing:** no route-to-contract or response-conformance CI check.
- **Action/WP:** add an automated runtime/OpenAPI inventory gate in `WP-036`/`WP-037`; define typed schemas and stable errors before implementation.

### ADR-0003 — PostgreSQL in Production and SQLite Locally — High

- **Decision/status:** Accepted; production integration pending.
- **Evidence (Verified):** SQLite default, PostgreSQL pool/adapter, Compose PostgreSQL/pgvector, and dialect-specific migrations exist.
- **Missing/conflicts:** no verified managed-production cutover, migration ledger, concurrent adapter tests, or representative upgrade test; ADR text understates the now-present PostgreSQL adapter.
- **Security:** PostgreSQL TLS uses `rejectUnauthorized: false` when enabled (`backend/postgres.js`).
- **API/database:** SQLite and PostgreSQL use different tables/semantics for content and task IDs.
- **Testing:** Docker smoke checks counts, not full CRUD/constraints/concurrency/authorization parity.
- **Action/WP:** complete `WP-017`/`WP-029`; define certificate validation and adapter parity before production.

### ADR-0004 — Database Migrations and Environment Parity — High

- **Decision/status:** Accepted; split implementation.
- **Evidence (Verified):** numbered SQL exists under both migration directories; Compose applies PostgreSQL files.
- **Missing/conflicts:** no migration ledger; SQLite executes all files whenever `backend/database.js` loads; `docker/postgres/init/001-schema.sql` duplicates schema/seed work before numbered migrations.
- **Security:** `db:reset` has no code-level production guard.
- **API/database:** no expand/migrate/contract tooling or production migration runner.
- **Testing:** clean PostgreSQL migration smoke exists, but no upgrade-from-representative-state or rollback/forward-fix test.
- **Action/WP:** create explicit ledger-backed commands under `WP-015`, `WP-017`, and `WP-037` before authoring tables.

### ADR-0005 — Role-Based Access Control — Critical

- **Decision/status:** Proposed; amended by this review without changing status.
- **Evidence (Verified):** conceptual permissions only; current schema has a single `users.role` column and no permission middleware.
- **Missing/conflicts:** no approved roles, permission bundles, page scopes, ownership/team model, or author/publisher separation.
- **Security:** every non-production mutation bypasses identity; production uses a shared key.
- **API/database:** normalized roles, permissions, mappings, scoped assignments, and audit storage are absent.
- **Testing:** no `401`, `403`, cross-scope, role-change, or deny-by-default tests.
- **Action/WP:** approve permission policy, then implement `WP-035` and `WP-036`; authoring additions are proposed in the ADR amendment.

### ADR-0006 — Journey, Work Packages, and Status — High

- **Decision/status:** Accepted direction; implementation in progress.
- **Evidence (Verified):** task/training resources and status endpoints exist.
- **Missing/conflicts:** no `journeys`, `work_packages`, or immutable `status_history`; code accepts only `start`/`complete` while the ADR includes `pending` and `blocked`; task updates can directly change arbitrary allowed fields.
- **Security:** no owner/team scope or actor attribution.
- **API/database:** global task rows are used instead of per-user progression despite `user_task_progress` tables being present and unused.
- **Testing:** no transition state-machine, ownership, history, or concurrency tests.
- **Action/WP:** resolve product semantics and complete `WP-008`, `WP-031`, and `WP-036`.

### ADR-0007 — Engineering Verification Standards — High

- **Decision/status:** Accepted.
- **Evidence (Verified):** `npm run verify` exists; backend uses `node --test`; image publishing runs frontend/backend checks and Docker smoke.
- **Missing/conflicts:** checks are not a pull-request workflow; contract/RBAC gates are absent; the review's `npm run verify` attempt spent about 100 seconds generating test bundles and was interrupted before test results.
- **Security:** no mandatory negative security suite.
- **API/database:** OpenAPI parsing alone does not verify parity.
- **Testing:** two backend tests only; many frontend specs assert only creation.
- **Action/WP:** implement repeatable PR gates and focused test layers under `WP-029` and each feature package.

### ADR-0008 — Frontend Test Strategy — High

- **Decision/status:** Accepted.
- **Evidence (Verified):** Angular/Vitest specs and one Playwright draft exist.
- **Missing/conflicts:** no Playwright config or npm script; `playwright-prod-skip-sso.spec.ts` targets a hardcoded deployed URL and starts on `/dashboard` while expecting the landing-page Skip SSO button.
- **Security:** no guest/read-only/author/publisher denial browser coverage.
- **API/database:** service coverage is sparse; only leadership has an HTTP request test.
- **Testing:** Announcement has no executable test cases; most specs are smoke creation tests.
- **Action/WP:** add isolated local browser fixtures under `WP-035`, `WP-038`, and `WP-029`; never target mutable production by default.

### ADR-0009 — Local-Only Swagger UI — Medium

- **Decision/status:** Accepted.
- **Evidence (Verified):** mounted only when `NODE_ENV=development` and `SWAGGER_UI=true` in `backend/server.js`.
- **Missing/conflicts:** production exclusion is documented but not currently covered by backend tests.
- **Security:** the condition is correct, but environment classification is relied upon elsewhere for authorization and must be separated.
- **API/database:** Swagger renders a contract with known route drift.
- **Testing:** no current automated local-200/production-404 route test.
- **Action/WP:** retain behavior; add exclusion and contract parity tests under `WP-029`.

### ADR-0010 — Initial OpenAPI and SQLite Implementation — Medium

- **Decision/status:** Accepted and implemented for the initial slice.
- **Evidence (Verified):** OpenAPI, SQLite database, migrations, repository, lifecycle scripts, and Swagger exist.
- **Missing/conflicts:** ADR references nonexistent `backend/scripts/db-cli.js`; actual command is `backend/scripts/database.js`; it overstates verification longevity.
- **Security:** explicitly incomplete and still incomplete.
- **API/database:** automatic migration-on-import remains; no ledger.
- **Testing:** only current leadership repository behavior has backend tests.
- **Action/WP:** correct evidence references during future ADR cleanup; track remaining work in later ADRs rather than expanding this historical record.

### ADR-0011 — Site API and Relational Data Model — High

- **Decision/status:** Proposed.
- **Evidence (Verified):** inventory exists in `docs/api-data-inventory.md`; one backend runtime remains.
- **Missing/conflicts:** `/api/v1` is absent; identity, audit, and authoring boundaries are not implemented.
- **Security:** compatibility writes have no real principal.
- **API/database:** compatibility JSON payload tables coexist with normalized but often unused tables (`leadership_sections` and `leadership_members`, `announcements` and `home_announcements`).
- **Testing:** no normalized/compatibility reconciliation tests.
- **Action/WP:** approve bounded models; use `ADR-0036` page adapters rather than one catch-all content model.

### ADR-0012 — Complete Domain Table Inventory — High

- **Decision/status:** Proposed candidate inventory.
- **Evidence (Verified):** candidate table documentation and a partial migration exist.
- **Missing/conflicts:** ownership, lifecycle, and API policy remain unresolved; current `users.role` conflicts with proposed normalized RBAC.
- **Security:** data classification and field-level visibility are unapproved.
- **API/database:** most candidate tables are absent; existing table presence must not be treated as feature implementation.
- **Testing:** no schema-coverage or lifecycle tests.
- **Action/WP:** implement only bounded, approved slices; authoring tables belong to `WP-037`, identity tables to `WP-036`/`WP-041`.

### ADR-0013 — Local Database Lifecycle Commands — High

- **Decision/status:** Accepted/implemented for SQLite.
- **Evidence (Verified):** migrate, seed, check, and reset scripts exist.
- **Missing/conflicts:** migrations happen on repository load; reset has no production/config guard; seed is only a message because content is migration-backed.
- **Security:** a misdirected `DATABASE_PATH` can be removed by reset.
- **API/database:** no ledger or separately observable applied-version state.
- **Testing:** lifecycle commands are not covered with a disposable path in CI.
- **Action/WP:** harden `WP-015`; separate migrate/seed/runtime open and enforce local reset safeguards.

### ADR-0014 — Existing API Content Backed by SQLite — High

- **Decision/status:** Accepted/implemented for current local API.
- **Evidence (Verified):** request handlers call repositories, not JSON fixtures.
- **Missing/conflicts:** PostgreSQL reads different normalized/compatibility tables in several areas; direct live writes have no lifecycle.
- **Security:** write routes use temporary/non-production bypass behavior.
- **API/database:** SQLite leadership update replaces payload, while PostgreSQL merges approved fields; home and links use different physical models.
- **Testing:** no route-level content CRUD or adapter parity suite.
- **Action/WP:** retain public read compatibility; reconcile source tables in `WP-037`/`WP-040` before migration.

### ADR-0015 — User Administration Experience — High

- **Decision/status:** Accepted as planned; amended without status change.
- **Evidence (Verified):** no admin route, UI, API, or implemented normalized RBAC.
- **Missing/conflicts:** admin bootstrap, recovery, privacy, and lifecycle decisions remain open.
- **Security:** current `users.role` is insufficient and unused for enforcement; development fixtures must not become production users.
- **API/database:** planned user/role endpoints and normalized tables are absent.
- **Testing:** no user admin tests.
- **Action/WP:** defer UI until `WP-036`; keep dev fixtures isolated per `ADR-0035`.

### ADR-0016 — PostgreSQL Production Integration — High

- **Decision/status:** Accepted implementation plan.
- **Evidence (Verified):** PostgreSQL adapter, pool, schema, Compose, and check command now exist.
- **Missing/conflicts:** ADR context saying there is no adapter is stale; no production migration command/ledger, managed backup evidence, or CI integration suite exists.
- **Security:** TLS certificate verification is disabled when SSL is enabled.
- **API/database:** parity is incomplete and query behavior differs.
- **Testing:** count-based smoke only; no upgrade/concurrency/authorization suite.
- **Action/WP:** update status evidence later; complete `WP-017`/`WP-029` before production claims.

### ADR-0017 — API Hardening and Production Readiness — Critical

- **Decision/status:** Accepted remediation plan.
- **Evidence (Verified):** basic object/action/ID validation, health routes, and Docker smoke exist.
- **Missing/conflicts:** every major security/contract/database gate remains incomplete; source-of-truth cleanup is partial.
- **Security:** non-production fail-open writes and production shared-key writes directly violate the security gate; CORS is unrestricted.
- **API/database:** contract drift, automatic migrations, no ledger, and global task state remain.
- **Testing:** no authorization or route-contract suite.
- **Action/WP:** make `WP-035`/`WP-036` prerequisites for authoring; retain `WP-018` as production blocker.

### ADR-0018 — Production Hosting and API Topology — High

- **Decision/status:** Proposed; repository has moved beyond parts of its context.
- **Evidence (Verified):** Container Apps/ACR-oriented Docker and image-publish workflow exist; GitHub Pages workflow still exists.
- **Missing/conflicts:** approved environments, origins, owners, budgets, ingress, secrets, and availability targets are not evidenced; image publishing is not deployment.
- **Security:** no verified CORS allow-list, production auth, or secret-management path in runtime code.
- **API/database:** frontend build does not pass `VITE_API_BASE_URL` in the image workflow; Nginx uses a build-time backend target.
- **Testing:** no post-deployment full-stack browser smoke in workflow.
- **Action/WP:** reconcile topology and ownership through `WP-019`, `WP-034`, and `WP-041`.

### ADR-0019 — Identity and Access Lifecycle — Critical

- **Decision/status:** Proposed; amended without status change.
- **Evidence (Verified):** frontend MSAL account display exists; backend identity lifecycle does not.
- **Missing/conflicts:** authority, claims, role mapping, provisioning, deprovisioning, bootstrap, and recovery are unapproved.
- **Security:** no token validation or stable issuer/subject mapping; email/display name could not safely substitute.
- **API/database:** no `user_identities`, normalized role mapping, active-state enforcement, or session/me contract.
- **Testing:** no invalid-token, unmapped-user, deactivated-user, or role-change tests.
- **Action/WP:** use isolated Development Mode (`WP-035`) now; defer tenant mapping to `WP-041`.

### ADR-0020 — Data Protection and Retention — High

- **Decision/status:** Proposed.
- **Evidence (Verified):** repository stores employee/leadership/task/contact-like structures; no approved classification/retention policy is documented.
- **Missing/conflicts:** authoring history, discarded drafts, audit records, contact form data, and identity lifecycle retention need owners.
- **Security:** logs/errors/audit redaction and access are not implemented.
- **API/database:** no retention/archive/delete model; contact form currently does not persist despite success UI.
- **Testing:** no deletion/export/retention or audit-integrity tests.
- **Action/WP:** approval is required before production identity/authoring history; feed decisions into `WP-039`/`WP-041`.

### ADR-0021 — Operations and Reliability — High

- **Decision/status:** Proposed.
- **Evidence (Verified):** live/ready endpoints, Docker health checks, incident/testing runbooks exist.
- **Missing/conflicts:** SLO, RTO/RPO, backup/restore, alerting, responders, migration evidence, and staging ownership remain absent.
- **Security:** readiness returns raw database error messages; operational endpoint disclosure needs review.
- **API/database:** no production backup or restore evidence.
- **Testing:** no restore drill, failover, dependency failure, or alert test.
- **Action/WP:** resolve before production publication; include authoring recovery in `WP-039`.

### ADR-0022 — API Lifecycle and Compatibility — High

- **Decision/status:** Proposed.
- **Evidence (Verified):** compatibility `/api/*` routes and one deprecated Journey contract exist.
- **Missing/conflicts:** no `/api/v1`, standard error/correlation envelope, pagination policy, deprecation telemetry, or owner.
- **Security:** authentication/authorization responses are incomplete.
- **API/database:** runtime org-chart routes are undocumented; new authoring/session APIs require a versioned boundary.
- **Testing:** no compatibility or deprecation tests.
- **Action/WP:** approve common error/concurrency semantics before `WP-035`/`WP-037` contracts.

### ADR-0023 — Announcement Domain and Content Management — High

- **Decision/status:** Proposed; amended without status change.
- **Evidence (Verified):** dashboard content is database-backed; dedicated Announcement content is hardcoded in `src/app/announcement/announcement.ts` and `.html`.
- **Missing/conflicts:** owners, audience, schedule, rich text, publisher role, and managed/static field inventory are unapproved.
- **Security:** existing update route writes live content through temporary controls and has no audit.
- **API/database:** no dedicated page aggregate, versions, drafts, or page-specific tables/documents.
- **Testing:** Announcement spec has no tests; no loading/error/empty behavior.
- **Action/WP:** accept separate dashboard/page domains; implement dedicated page first under `WP-038` after `WP-037`.

### ADR-0024 — Legacy JSON Data and Database Source of Truth — Medium

- **Decision/status:** Proposed.
- **Evidence (Verified):** runtime handlers do not read JSON; migration SQL populates data.
- **Missing/conflicts:** `backend/stubs-data/*.json` remains tracked despite work-package claims that all legacy files were removed; no checksum/import ledger or retirement label exists.
- **Security:** future import authorization and overwrite protection are undefined.
- **API/database:** migration/import semantics across engines remain unclear.
- **Testing:** no test proves stubs are non-runtime or import idempotence/governance.
- **Action/WP:** explicitly delete, archive, or label fixtures and add a runtime-dependency check in `WP-025`.

### ADR-0025 — Structured Data and Binary Storage — Medium

- **Decision/status:** Proposed.
- **Evidence (Verified):** structured Journey data is migration-backed; binaries are files; some leadership images use transient Figma URLs.
- **Missing/conflicts:** durable asset provider, metadata, licensing, scanning, upload scope, cache, and retention are unresolved.
- **Security:** uploads must not be added before type/size/scanning/access policy.
- **API/database:** no asset metadata/reference model.
- **Testing:** no invalid/missing media or storage lifecycle suite.
- **Action/WP:** initial authoring may reference curated repository assets only; approve storage before uploads in `WP-040`.

### ADR-0026 — PostgreSQL Connection Setup — High

- **Decision/status:** Accepted setup; parity pending.
- **Evidence (Verified):** `pg` pool, environment selection, and `db:postgres:check` exist.
- **Missing/conflicts:** PostgreSQL adapter now exists beyond the original scope; production certificate policy and pool operational limits are unverified.
- **Security:** `rejectUnauthorized: false` is explicitly unsafe for final production certificate validation.
- **API/database:** connection readiness does not prove migration or API readiness.
- **Testing:** no connection-failure/redaction/pool shutdown suite.
- **Action/WP:** require verified CA settings and integration tests in `WP-017`/`WP-041`.

### ADR-0027 — Leadership Organizational Chart — Critical

- **Decision/status:** Withdrawn; implementation deferred.
- **Evidence (Verified):** frontend does not render an org chart and OpenAPI omits it.
- **Missing/conflicts:** runtime exposes full org-chart CRUD; adapters implement it; Docker init seeds it; backend test asserts it. This directly contradicts the decision and prior work-package completion claim.
- **Security:** undocumented mutations inherit the fail-open non-production behavior/shared key.
- **API/database:** unapproved records can be created in `leadership_sections`.
- **Testing:** the only substantive backend CRUD test reinforces withdrawn behavior.
- **Action/WP:** treat `WP-028` as incomplete cleanup; remove or explicitly isolate artifacts in a reviewed implementation change.

### ADR-0028 — Database Test and CI Strategy — High

- **Decision/status:** Proposed.
- **Evidence (Verified):** Compose PostgreSQL/pgvector smoke and image workflow exist; two SQLite backend tests pass.
- **Missing/conflicts:** ADR statement of zero backend tests is stale, but required PostgreSQL integration, PR, Playwright, artifact, and migration gates are still absent.
- **Security:** no authorization test gate.
- **API/database:** smoke verifies counts but not behavior parity.
- **Testing:** no `pull_request` workflow; image publishing is the de facto heavy check only on main/manual runs.
- **Action/WP:** implement dedicated verification workflow under `WP-029`, independent from publish/deploy.

### ADR-0029 — SSO-Compatible Leadership RBAC — Critical

- **Decision/status:** Proposed; amended without status change.
- **Evidence (Verified):** public leadership GET and frontend SSO UI exist.
- **Missing/conflicts:** no token validation, role mapping, editor UI, audit, or permission enforcement; withdrawn org-chart routes remain.
- **Security:** leadership mutation is open outside production and shared-key protected in production.
- **API/database:** direct live overwrite differs by adapter; no draft/version lifecycle.
- **Testing:** only read-service test and org-chart repository CRUD; no negative leadership authorization.
- **Action/WP:** use `leadership:edit`/`leadership:publish`; implement after `WP-036` and expand under `WP-040`.

### ADR-0030 — Journey API Source of Truth — High

- **Decision/status:** Proposed.
- **Evidence (Verified):** `/journey` redirects to `/my-journey`; task/training services use API and display mutation errors.
- **Missing/conflicts:** legacy localStorage components and `/api/journey/items` remain; global rows are not ownership-scoped; deprecation evidence is absent.
- **Security:** no authenticated owner/team checks.
- **API/database:** PostgreSQL compatibility maps Journey items to tasks while SQLite has a separate table.
- **Testing:** no read-after-write, parent-transition, deprecation, ownership, or cross-scope backend tests.
- **Action/WP:** finish `WP-031` with usage evidence and `WP-036` authorization before route retirement.

### ADR-0031 — Azure Deployment from GitHub Actions — High

- **Decision/status:** Proposed.
- **Evidence (Verified):** Dockerfiles, Compose, ACR image-publish workflow, and apparent Container Apps host assumptions exist.
- **Missing/conflicts:** ADR implementation boundary says no workflow, but `.github/workflows/publish-azure-images.yml` now exists; no Container Apps deploy/migration/promotion steps are committed.
- **Security:** OIDC publish is present, but runtime secrets, identity, CORS, and protected production promotion are not evidenced.
- **API/database:** no release migration runner or verified external API URL in frontend build.
- **Testing:** no post-deploy smoke or rollback evidence.
- **Action/WP:** update historical implementation notes later; complete `WP-032`/`WP-034`/`WP-041` before production claims.

### ADR-0032 — Entra API Token Integration — Critical

- **Decision/status:** Proposed; amended without status change.
- **Evidence (Verified):** MSAL redirect login requests only `openid profile email`; frontend stores an account but no API token; backend has no JWT/JWKS dependency or middleware.
- **Missing/conflicts:** SPA/API registrations, scope, role/group mapping, origins, and lifecycle are unapproved; hardcoded fallback tenant/client IDs remain in `src/app/auth/auth.service.ts`.
- **Security:** public API has no bearer validation; temporary key is not user authorization.
- **API/database:** no security scheme for bearer token, identity reconciliation, or normalized mappings.
- **Testing:** no token acquisition/verifier/claim-negative suite.
- **Action/WP:** build local/test paths without Entra under `WP-035`; complete tenant-specific work only in `WP-041`.

### ADR-0033 — GitHub Actions Azure Deployment Automation — High

- **Decision/status:** Proposed.
- **Evidence (Verified):** workflow verifies locally, logs into Azure with OIDC, and pushes SHA-tagged images.
- **Missing/conflicts:** ADR says no workflow was added; current workflow lacks migration, deployment, smoke, protected promotion, rollback tracking, scanning, and cleanup.
- **Security:** publish credential is federated; production environment controls are not represented.
- **API/database:** no migration or target revision update.
- **Testing:** verification is tied to publish and does not run on pull requests.
- **Action/WP:** split verification from delivery and complete `WP-034`; do not call image publication deployment.

### ADR-0034 — API-Backed Announcement Page Content — High

- **Decision/status:** Proposed; amended without status change.
- **Evidence (Verified):** page content and placeholder links remain hardcoded; no page API/service/migration exists.
- **Missing/conflicts:** no managed/static inventory approval, editor roles, lifecycle, schema version, asset policy, or preview design.
- **Security:** proposed update behavior needs backend edit/publish enforcement; existing temporary bridge is inadequate.
- **API/database:** aggregate endpoint and typed sections are absent; public/dashboard announcement contract must remain separate.
- **Testing:** no page tests, API tests, or empty-carousel protection.
- **Action/WP:** make this the first page adapter/editor in `WP-038`, using `ADR-0036`/`ADR-0037`.

## 3. Existing implementation evidence

Verified repository capabilities include:

- Angular standalone routes and public pages: `src/app/app.routes.ts` and feature folders under `src/app/`.
- MSAL interactive identity UI and redirect handling: `src/app/auth/auth.service.ts`.
- Guest navigation through Skip SSO: `src/app/index/index.component.ts`; this is not authentication.
- Database-backed public reads for home, leadership, tasks, training, and Song links: frontend services plus `backend/server.js` repositories.
- SQLite and PostgreSQL adapters: `backend/database.js`, `backend/postgres-database.js`.
- Versioned SQL files: `backend/migrations/`, `backend/migrations-postgres/`.
- OpenAPI compatibility contract: `docs/openapi/song-site.yaml`.
- Local Swagger gate, health endpoints, Docker/pgvector profile, Nginx proxy, and smoke script.
- CI image publication through Azure OIDC: `.github/workflows/publish-azure-images.yml`.
- Two passing SQLite backend tests observed with `cd backend && npm test`.

These are implementation facts, not evidence of production authorization, authoring, complete PostgreSQL parity, or full deployment.

## 4. Missing architectural decisions

The following require Approval:

1. Development fixture roles, loopback/container policy, local session duration, and signing-key policy (`ADR-0035`).
2. First authorable pages/sections, static-versus-managed fields, rich-text policy, and preview route experience (`ADR-0036`).
3. Author/publisher separation, one versus multiple drafts, conflict status semantics, locale/audience variants, and retention (`ADR-0037`).
4. Production Entra tenant/app registrations, delegated scope, group/app-role mapping, deprovisioning, and recovery (`ADR-0019`, `ADR-0032`).
5. Data classification, audit/version retention, asset storage, and upload policy (`ADR-0020`, `ADR-0025`).
6. Production ownership, environments, origins, SLO/RTO/RPO, backup, and incident response (`ADR-0018`, `ADR-0021`, `ADR-0031`).

## 5. Contradictions and overlapping ADRs

| Severity | Contradiction/overlap | Evidence | Correction |
| --- | --- | --- | --- |
| Critical | Withdrawn org-chart feature is live and tested | `ADR-0027`; `backend/server.js`; both adapters; Docker seed; backend test | `WP-028` reopened as cleanup; `ADR-0029` amendment excludes it |
| High | ADR-0031/0033 implementation boundaries say no workflow, but image publication exists | `.github/workflows/publish-azure-images.yml` | Preserve proposal status; distinguish build/publish from deploy |
| High | Work package said all legacy JSON removed, but tracked stubs remain | `backend/stubs-data/*.json` | Corrected `WP-025`; approve delete/archive/fixture role |
| High | SQLite/PostgreSQL content sources differ despite parity claims | `backend/database.js`; `backend/postgres-database.js`; duplicate migration tables | Reconcile through page adapters/migrations before writes |
| High | ADR-0023 offered unified/separate choice while ADR-0034 selected a dedicated aggregate | Both ADRs | ADR-0023 amendment records ADR-0034 as proposed resolution |
| High | ADR-0029 “no second login” could block local work | `ADR-0029` | Amendment limits this to Production Mode and relates `ADR-0035` |
| Medium | Historical ADR evidence names missing/renamed scripts or stale test state | `ADR-0010`, `ADR-0016`, `ADR-0028` | Report drift; do not silently rewrite historical status |

## 6. Authentication and Development Mode gaps

Current behavior has no authenticated local developer identity. Skip SSO produces Guest Mode only. Development writes are effectively anonymous because `NODE_ENV !== production` skips the key check. This prevents meaningful testing of allowed and denied permissions.

The recommended architecture in `ADR-0035` is a backend-selected provider with fixed fixtures, signed local session cookies, CSRF/same-origin controls, loopback binding, explicit container-test override, and startup refusal in deployed/production conditions. The browser can select only a backend-known fixture, never roles or permissions. Production Mode rejects all development sessions and continues to require Entra.

## 7. Authoring Mode capability gaps

No current page supports the required lifecycle. Existing database write routes update published rows directly. The Announcement page is the best first slice because all sections are inventoried and currently hardcoded. Leadership is second because it is database-backed but structurally different and needs nested/reorder controls.

The recommended hybrid in `ADR-0036` provides shared identity, permission, edit shell, validation, dirty-state, Save/Preview/Publish/Cancel/Discard, audit, version, recovery, and conflict behavior. Page-specific adapters/editors retain typed schemas. `ADR-0037` defines immutable versions and optimistic concurrency.

Current hardcoded-content candidates include:

- dedicated Announcement content: `src/app/announcement/announcement.ts`, `announcement.html`;
- About Us narrative/cards: `src/app/aboutus/aboutus.ts`, `aboutus.html`, and duplicate `display.ts` data;
- Technologies groups: `src/app/song3/song3.ts`, `song3.html`;
- Song Bench landing copy: `src/app/song-bench/song-bench.html`;
- Other Links: `src/app/other-links/other-links.ts` (separate from database-backed ATCP Song Links);
- leadership hero/section labels and external visual assets: `src/app/atcp-song/atcp-song.html`;
- numerous Journey task instruction templates, which should remain outside page authoring until ownership and domain boundaries are approved.

## 8. API and database gaps

- No versioned session, principal, authoring, draft, preview, publish, history, restore, or conflict contract.
- No normalized permission/audit implementation; `users.role` is not the ADR model.
- No content document/version/audit tables.
- No migration ledger on either adapter.
- SQLite applies migrations at module load; PostgreSQL Compose applies an unversioned base schema plus numbered migrations.
- Direct content writes have weak schemas and adapter differences.
- Live org-chart routes are absent from OpenAPI.
- `user_task_progress`, normalized content tables, and compatibility tables have unclear runtime ownership.

## 9. Security risks

| Severity | Verified risk | Required response |
| --- | --- | --- |
| Critical | All non-production mutations bypass authentication | Replace with `WP-035`/`WP-036`; fail closed |
| Critical | No production bearer-token validation or permission enforcement | Complete `WP-041` before protected production writes |
| Critical | Unapproved org-chart mutation surface | Remove/isolate under `WP-028` |
| High | Shared `X-Admin-Key` has no user attribution or scoped permissions | Time-bound and retire after identity path verification |
| High | CORS accepts all origins | Environment-specific allow-list before deployed writes |
| High | PostgreSQL TLS disables certificate verification | Configure verified CA/certificate policy |
| High | Draft/history confidentiality and audit immutability do not exist | Implement `WP-037`/`WP-039` |
| Medium | Hardcoded Entra client/tenant fallback can conceal configuration drift | Require explicit production config during `WP-041` |
| Medium | External Figma asset URLs are not durable governed storage | Curate/localize or approve asset provider |

## 10. Test coverage gaps

- Backend: two SQLite tests, both leadership-focused; no HTTP, auth, validation, task, content, PostgreSQL, migration-upgrade, or concurrency tests.
- Frontend: many component-creation tests; no Announcement tests; sparse service and failure-state coverage.
- Browser: one unconfigured hardcoded Playwright draft with internally inconsistent navigation.
- Contract: YAML parsing succeeds, but there is no lint, runtime route parity, schema response, or breaking-change gate.
- CI: no pull-request workflow; publish workflow does not deploy or post-deploy test.
- Review command evidence: OpenAPI parse passed; backend tests passed 2/2; frontend `npm run verify` was interrupted after approximately 100 seconds of test bundle generation, before tests/build completed, so no pass is claimed.

## 11. Proposed ADR changes

Updated without changing status:

- `ADR-0005`, `ADR-0015`, `ADR-0019`, `ADR-0023`, `ADR-0029`, `ADR-0032`, `ADR-0034`.

Created as proposed decisions:

- `ADR-0035`: Development Authentication and Identity Isolation.
- `ADR-0036`: Page Authoring Architecture.
- `ADR-0037`: Content Versioning and Publication Lifecycle.

No existing proposed ADR was silently accepted, and no withdrawn ADR was reactivated.

## 12. Work package recommendations

Detailed packages are in `docs/work-packages/authoring-development-program.md`:

1. `WP-035` Secure Local Development Mode.
2. `WP-036` Backend Principal and Permission Enforcement.
3. `WP-037` Authoring API and Persistence Foundation.
4. `WP-038` Announcement Page Editor.
5. `WP-039` Publication and Recovery Qualification.
6. `WP-040` Leadership and Selected-Page Expansion.
7. `WP-041` Production Entra Integration and Release Qualification.

Existing `WP-028` was corrected from complete to cleanup in progress because org-chart artifacts remain. `WP-015`, `WP-024`, `WP-025`, and `WP-029` evidence/status text was also corrected.

## 13. Implementation priority matrix

| Priority | Work | Can proceed without Entra? | Primary blocker |
| --- | --- | --- | --- |
| P0 | Approve `ADR-0035` safeguards and implement `WP-035` | Yes | Product/security decisions |
| P0 | Remove automatic mutation bypass; implement `WP-036` | Yes | Permission policy and temporary-key migration |
| P0 | Remove/isolate withdrawn org-chart runtime | Yes | Review of cleanup/migration impact |
| P1 | Approve `ADR-0036`/`ADR-0037`; implement `WP-037` | Yes | Lifecycle/concurrency/retention choices |
| P1 | Implement Announcement editor `WP-038` | Yes | Managed-field and role approval |
| P1 | Add PostgreSQL/auth/contract/browser CI gates | Yes | Test infrastructure |
| P2 | Qualify publication/recovery `WP-039` | Yes | Retention and operations approval |
| P2 | Leadership/selected-page expansion `WP-040` | Yes | Source-of-truth and page inventory approval |
| P3 | Production Entra/release qualification `WP-041` | No | Organizational tenant/app/claim access |

## 14. Decisions requiring product-owner approval

1. Approve, revise, or reject `ADR-0035`, including local fixtures and container binding policy.
2. Approve the hybrid shared-framework/page-specific-editor approach in `ADR-0036`.
3. Approve `ADR-0037` choices: one versus parallel drafts, conflict response, retention, and author/publisher separation.
4. Confirm Announcement as the first editor and identify exactly which hero/headings/body/media fields are managed.
5. Confirm leadership edit/publish roles and one authoritative storage representation.
6. Approve the initial permission catalog and whether authors can publish their own drafts.
7. Approve content/audit/version retention and data classification.
8. Approve curated repository assets versus managed uploads for the first release.
9. Confirm removal of the unapproved org-chart runtime/seed/test artifacts.
10. Later, provide Entra tenant/app registration, scope, claim mapping, and production ownership decisions for `WP-041`.

## 15. Implementation update (2026-10-13)

The assessment baseline has now been partially implemented on the feature branch. `WP-035` and the current mutation boundary of `WP-036` have backend code and passing focused tests. The first `WP-037`/`WP-038` Announcement slice has SQLite persistence, PostgreSQL migration/adapter code, validation, draft/preview/publish/discard/version/restore endpoints, optimistic conflicts, audit events, and published API rendering. Withdrawn org-chart runtime methods/routes/seed data were removed; existing rows are archived by migrations rather than silently deleted.

This does not close the full gap report. The editor and API security browser slice are now implemented locally; route/OpenAPI parity passed 2/2 and API CSRF/conflict acceptance passed 1/1. The full browser suite previously passed 5/5, but subsequent reruns exposed deterministic-state and discarded-version concurrency issues; the latter was corrected in both database drivers and requires final rerun evidence. Clean/upgrade/repeat PostgreSQL migration checks, frontend unit/build reruns after the final correction, production Entra token validation, and WP-041 remain open.
