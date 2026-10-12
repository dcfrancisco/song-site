# Authoring and Development Mode Implementation Plan

- Status: Proposed plan; functionality is not implemented
- Date: 2026-10-13
- Governing proposals: `ADR-0035`, `ADR-0036`, `ADR-0037`
- Work packages: `WP-035` through `WP-041`

## 1. Outcome and constraints

Build selected-page authoring without making Microsoft Entra access a prerequisite for local development. Public pages remain read-only by default and preserve their current layouts. Guest navigation remains available through Skip SSO, but Skip SSO never grants a backend identity or permission.

The plan separates identity provider from authorization policy:

```text
Guest request ───────────────┐
Development local session ──┼─> trusted backend principal ─> permission + scope policy ─> API operation
Production Entra token ─────┘
```

All three paths use the same route-level permission checks. Only the way the backend establishes the principal changes.

## 2. Proposed user experience

### Guest Mode

- The existing Skip SSO action opens public pages as it does today.
- Navigation and page content remain readable where approved.
- The profile area states `Guest` or `Signed out` consistently.
- Edit controls are absent, but direct mutation attempts still receive `401` from the backend.
- No local-storage flag, frontend environment value, or hidden control upgrades the guest.

### Development Mode

- The developer explicitly starts the backend with Development Mode enabled.
- A local-only identity chooser offers backend-defined profiles such as Read-only Member, Announcement Author, Announcement Publisher, Leadership Editor, and Inactive User. The request contains only a fixture key; the backend owns its roles and permissions.
- The backend issues a signed, `HttpOnly`, `SameSite=Strict` local session.
- A persistent UI badge displays `Development identity: <name>` and the active fixture; it cannot be confused with an Entra account.
- Switching fixture ends the previous session, reloads effective permissions, and allows denial/role-change testing.
- If the backend detects production mode, a deployment marker, an unsafe listener/origin, or invalid session configuration, startup fails rather than exposing development authentication.

### Production Mode

- Existing MSAL redirect/login/logout remains the browser identity experience.
- Angular acquires a delegated Song Site API token and attaches it only to the approved API origin.
- The backend validates token signature, issuer, tenant, audience, expiry, and scope, reconciles the user, and resolves approved roles/permissions.
- Development sessions and fixtures are rejected.
- Guest public reads remain possible where explicitly approved.

### Authoring Mode

Authorized pages retain their normal published rendering until the user activates Edit Mode. Edit Mode adds a clear toolbar and section controls without changing the public page structure.

The toolbar shows:

- active identity and mode;
- published version and current draft version;
- draft state: clean, unsaved, saving, saved, invalid, conflicted, or publishing;
- actions: **Save**, **Preview**, **Publish**, **Cancel**, and **Discard**; and
- version history/recovery when permitted.

Operation behavior:

| Action | Result |
| --- | --- |
| Save | Validate and persist a draft; published content is unchanged. |
| Preview | Render the current validated draft for authorized users only. |
| Publish | Final-validate and atomically promote the selected draft/version. |
| Cancel | Exit the current editing interaction, dropping unsaved browser changes but retaining the last saved draft. |
| Discard | Confirm and abandon the saved draft; published history remains recoverable. |

Navigation away from unsaved changes prompts the user. API validation errors appear by section and field. `409`/`412` conflicts show the newer server version and offer reload/compare/copy options; the UI never silently overwrites.

## 3. Architecture recommendation

### Shared infrastructure

- Provider-neutral backend principal and permission middleware.
- Session/me contract for display of effective identity and permissions.
- Authoring route family, lifecycle service, optimistic concurrency, audit, and version history.
- Angular authoring shell: edit toolbar, identity badge, dirty-state guard, validation summary, conflict dialog, preview state, and permission directives/services.
- Page adapter registry that binds a page key to schema, validation, permission keys, persistence mapping, renderer, and editor.

### Page-specific models and editors

Use typed page payloads and tailored controls. Do not store arbitrary HTML or force all pages into dashboard announcement rows.

#### Announcement page — first slice

- `hero`: title and supporting copy if approved as managed.
- `carousel`: stable ID, title/name, body/certification label, media reference, optional link, order, active state.
- `trainings`: stable ID, title, description, URL, link label, order, active state.
- `notices`: stable ID, title, body, order, active state.
- `reminder`: title and body.

The public renderer remains `src/app/announcement/announcement.html`; managed hardcoded values move from `announcement.ts`/`.html` only after an initial published version exists. Carousel controls must handle an empty list safely. Placeholder `#` links are invalid for Publish.

#### Leadership — second slice

- Preserve market, practice, capability, and enablement grouping.
- Provide person, role/category, image/reference, co-lead, group, ordering, active-state controls.
- Keep org-chart authoring excluded.
- Reconcile `leadership_sections` and `leadership_members` before migration and choose one published representation.

#### Later selected pages

Evaluate Home spotlight/quick announcements, Song Links, About Us, Technologies, Song Bench landing, and other hardcoded content. Each requires product ownership and a managed-versus-static field inventory. Journey/task instructions, contact submission, and user administration are transactional domains and are not automatically page authoring.

## 4. Backend design

### Authentication provider boundary

Proposed modules:

```text
backend/auth/principal.js
backend/auth/authenticate.js
backend/auth/providers/development.js
backend/auth/providers/entra.js
backend/auth/development-session.js
backend/middleware/require-permission.js
backend/middleware/require-csrf.js
```

The exact split may change during implementation, but provider selection must remain isolated from route handlers. The Development provider resolves only trusted fixtures. The Entra provider validates tokens. Both return one principal structure.

### Permission policy

Initial proposed keys:

- `content:announcement-page:edit`
- `content:announcement-page:publish`
- `leadership:edit`
- `leadership:publish`
- `content:history:read`
- `content:restore`

Permissions are checked at the route and page/document scope. Admin is not an implicit superuser unless an approved role-to-permission mapping grants the exact permission.

### API design

Define OpenAPI first under `/api/v1`:

```text
GET    /api/v1/session
POST   /api/v1/dev/session             local-only
DELETE /api/v1/dev/session             local-only

GET    /api/v1/content/pages/{pageKey}
GET    /api/v1/authoring/pages/{pageKey}/draft
PUT    /api/v1/authoring/pages/{pageKey}/draft
POST   /api/v1/authoring/pages/{pageKey}/preview
POST   /api/v1/authoring/pages/{pageKey}/publish
DELETE /api/v1/authoring/pages/{pageKey}/draft
GET    /api/v1/authoring/pages/{pageKey}/versions
POST   /api/v1/authoring/pages/{pageKey}/versions/{versionId}/restore
```

Public GET returns published content only. Draft, preview, history, and mutations require page-specific permissions. Writes require an ETag/expected version and return stable validation/conflict/error envelopes with correlation IDs.

### Persistence design

Logical tables:

```text
content_documents
  id, page_key, content_type, schema_version, locale, audience,
  published_version_id, created_at, updated_at

content_versions
  id, document_id, version_number, state, base_version_number,
  payload, authored_by, created_at, published_by, published_at,
  change_summary

content_drafts (if not represented by a draft version pointer)
  document_id, version_id, concurrency_token, updated_by, updated_at

content_audit_events
  id, document_id, actor_id, actor_provider, action,
  source_version_id, target_version_id, correlation_id, created_at,
  safe_metadata

content_assets (only when approved)
  id, stable_key, media_type, size, checksum, storage_reference,
  lifecycle_state, created_at
```

SQLite stores validated payload JSON as text; PostgreSQL uses `jsonb`. Adapters return the same typed models. Published versions are immutable. Restore creates a new draft. Publication and published-pointer change occur in one transaction.

## 5. Frontend design

### Shared components/services

Proposed new areas:

```text
src/app/session/session.service.ts
src/app/session/development-identity.component.*
src/app/authoring/authoring.service.ts
src/app/authoring/authoring-context.ts
src/app/authoring/authoring-toolbar.component.*
src/app/authoring/validation-summary.component.*
src/app/authoring/conflict-dialog.component.*
src/app/authoring/unsaved-changes.guard.ts
src/app/authoring/models/*
```

The frontend requests effective permissions for presentation, but it always handles `401`, `403`, `409`/`412`, and validation errors from the backend. Route/menu visibility is not a security control.

### Announcement components

Proposed page-specific files:

```text
src/app/announcement/announcement.model.ts
src/app/announcement/announcement.service.ts
src/app/announcement/editor/announcement-editor.component.*
src/app/announcement/editor/hero-editor.component.*
src/app/announcement/editor/carousel-editor.component.*
src/app/announcement/editor/trainings-editor.component.*
src/app/announcement/editor/notices-editor.component.*
src/app/announcement/editor/reminder-editor.component.*
```

The existing Announcement component remains the public renderer and can render either published or authorized preview payloads. Avoid a second preview-only renderer that can drift from production layout.

### Leadership components

Add page-specific editor orchestration under `src/app/atcp-song/editor/` after Announcement qualification. Reuse current display components for preview/public rendering where practical. Do not add org-chart UI.

## 6. Affected existing files

Likely implementation touchpoints, not changes made by this assessment:

| Area | Existing files |
| --- | --- |
| Backend startup/config | `backend/config.js`, `backend/server.js`, `.env.example`, `compose.yaml` |
| Persistence adapters | `backend/database.js`, `backend/postgres-database.js` |
| Migrations | `backend/migrations/`, `backend/migrations-postgres/`, `docker/postgres/init/` |
| API contract | `docs/openapi/song-site.yaml` |
| Frontend identity | `src/app/auth/auth.service.ts`, `src/app/index/index.component.ts`, `src/app/navbar/navbar.ts`, `navbar.html` |
| Routes/config | `src/app/app.routes.ts`, `src/app/app.config.ts`, `src/app/api.config.ts` |
| Announcement | `src/app/announcement/announcement.ts`, `announcement.html`, `announcement.css`, `announcement.specs.ts` |
| Leadership | `src/app/atcp-song/`, especially its service, models, template, and section components |
| Home/content compatibility | `src/app/home/`, `src/app/atcp-song-links/`, current backend content routes |
| Test/CI | `backend/*.test.js`, frontend specs, Playwright config/specs, `.github/workflows/` |
| Runbooks | `README.md`, `docs/runbooks/local-development.md`, testing/deployment runbooks |

## 7. Implementation stages

### Stage 1 — Secure local Development Mode (`WP-035`)

1. Approve fixture roles, session duration, loopback/container policy, and startup markers.
2. Add provider-neutral principal contract and Development provider.
3. Add local session/CSRF behavior and startup guards.
4. Add session endpoint and visible development identity UI.
5. Verify guest, read-only, author, publisher, inactive, expiry, logout, and unsafe-startup cases without Entra.

### Stage 2 — Backend identity and permission enforcement (`WP-036`)

1. Inventory every mutation route.
2. Define required permission and resource scope for each route.
3. Replace the automatic non-production allow path with authentication/permission middleware.
4. Add consistent `401`/`403`/validation envelopes and attribution.
5. Time-bound the shared key and retire it only after callers and tests migrate.

### Stage 3 — Authoring API and persistence (`WP-037`)

1. Approve draft, concurrency, retention, and role decisions.
2. Define OpenAPI components and state transitions.
3. Add ledger-backed SQLite/PostgreSQL migrations and adapter contracts.
4. Implement lifecycle service and a test page adapter.
5. Verify atomicity, conflict, authorization, history, and parity.

### Stage 4 — First page editor (`WP-038`)

1. Approve Announcement managed/static fields.
2. Create typed page schema and initial published version from current values.
3. Switch public renderer to the published API while preserving layout.
4. Add section-specific editor controls and explicit actions.
5. Verify Guest, read-only, author, publisher, validation, empty, conflict, and network states.

### Stage 5 — Publication lifecycle qualification (`WP-039`)

1. Run concurrent-editor and transaction-failure tests against PostgreSQL.
2. Verify immutable history, restore-to-new-draft, and Discard retention.
3. Add operational logging/metrics, backup/restore procedure, and recovery drill.
4. Resolve any lifecycle/API changes before expanding pages.

### Stage 6 — Leadership and selected pages (`WP-040`)

1. Remove/isolate withdrawn org-chart artifacts.
2. Reconcile leadership storage and migrate an initial published representation.
3. Implement tailored grouped leadership editing.
4. Inventory and approve each later page individually.
5. Add adapter/editor/migration/security tests per page.

### Stage 7 — Production SSO and release qualification (`WP-041`)

1. Obtain organizational tenant/app-registration decisions and access.
2. Configure API scope and approved role/group claims.
3. Implement frontend acquisition and backend token validation/reconciliation.
4. Prove Development Mode is unreachable in deployed environments.
5. Run protected staging authoring smoke, migration, backup/restore, rollback/forward-fix, and security qualification before production.

Stages 1 through most of 6 can proceed without organizational Entra access. Stage 7 is blocked by that access and the associated ownership decisions.

## 8. Acceptance criteria

### Development identity

- Local development starts and tests without Entra credentials.
- Guest Skip SSO is read-only.
- Backend-known fixtures support authorized and denied tests.
- Client roles/permissions/headers cannot elevate access.
- Unsafe/deployed Development Mode configurations fail startup.
- UI clearly labels a Development identity.

### Authoring

- Public pages remain read-only by default and retain current layout.
- Edit controls appear only as a UX reflection of effective permission.
- Save, Preview, Publish, Cancel, and Discard have distinct tested semantics.
- Published content changes only through an authorized atomic Publish.
- Every write has author attribution and an append-only audit event.
- Versions can be recovered by creating a new draft.
- Concurrent stale updates fail visibly without lost changes.
- Page-specific validation covers required fields, order, URLs, media, and constrained rich text.

### Production

- Valid Entra API tokens are checked server-side for approved tenant/audience/scope.
- Missing, invalid, expired, wrong-tenant, wrong-audience, unmapped, and under-permissioned requests fail closed.
- Development sessions/fixtures are rejected.
- Temporary bypasses are retired with evidence.

## 9. Verification strategy

### Unit tests

- Config/startup guards, fixture resolution, principal mapping, permission policy.
- Authoring state machine, schema validation, ETag/version comparison, audit event creation.
- Angular services, toolbar states, dirty-state logic, section editors, empty carousel behavior.

### API tests

- Success, malformed, not found, `401`, `403`, stale version, invalid transition, cross-page/scope.
- CSRF/origin/session expiry/logout in Development Mode.
- Draft confidentiality and published-only public reads.
- Route inventory against OpenAPI and middleware coverage.

### Database integration tests

- Fresh and upgrade migrations on SQLite and disposable PostgreSQL.
- Unique/current-published constraints, transactions, concurrency, immutable history, restore, audit integrity.
- Adapter response parity and failure rollback.

### Browser tests

- Guest Skip SSO read-only behavior.
- Development identity selection/label, read-only denial, author Save/Preview, publisher Publish.
- Validation, network error, unsaved navigation, conflict, Discard, and restore.
- Public layout regression for Announcement and leadership.
- Entra-specific staging tests only when approved tenant access exists.

### CI/release gates

- Add pull-request verification independent from image publication.
- Run frontend unit/build, backend unit/API, OpenAPI parity, SQLite lifecycle, PostgreSQL integration, and focused Playwright tests.
- Retain useful artifacts on failure.
- Run migration, post-deploy API/browser smoke, protected promotion, and rollback evidence before production.

## 10. Rollout and backward compatibility

- Keep existing public page routes and layouts.
- Introduce `/api/v1` authoring/session APIs additively.
- Seed current hardcoded/database content as initial published versions before switching renderers.
- Keep compatibility reads during migration; deprecate direct-to-live writes only after clients migrate and negative tests pass.
- Never expose drafts through compatibility GET routes.
- Do not remove the temporary key or legacy route solely because replacement code exists; require observed caller migration and release evidence.

## 11. Decisions required before implementation

1. Approve `ADR-0035`, including fixture set and listener/container safeguards.
2. Approve `ADR-0036` hybrid framework and Announcement-first sequence.
3. Approve `ADR-0037` draft count, conflict response, retention, and restore semantics.
4. Decide whether author and publisher must be separate people/roles.
5. Approve Announcement managed/static fields and rich-text/link/media policy.
6. Approve leadership source of truth and editor/publisher roles.
7. Approve org-chart artifact cleanup.
8. Approve data/audit/version retention and production operations ownership.

## 12. Implementation status and actual verification

Implemented on the feature branch:

- Backend-owned fixed Development identities, signed expiring HttpOnly sessions, CSRF/origin checks, loopback/deployment startup guards, and explicit permission middleware.
- Guest read-only behavior for Skip SSO and 401/403 protected mutation behavior.
- Announcement content schema, SQLite/PostgreSQL migrations, draft persistence, validation, preview, publish, discard, version list, restore-to-new-draft, audit events, and expected-version conflicts.
- Published Announcement rendering through the versioned API and local-development session selection UI.
- Org-chart runtime/seed cleanup with archived historical rows.

Actual verification:

| Check | Result |
| --- | --- |
| `node --test backend/auth.test.js backend/authoring.test.js backend/authorization-regression.test.js backend/server-security.test.js` | PASS: focused local lifecycle/security suite passed before the final PostgreSQL concurrency correction; rerun required after the correction |
| `node --test backend/server-security.test.js` with loopback permission | PASS: 2 tests, 2 passed |
| OpenAPI YAML parse and route parity | PASS: YAML parsed; `backend/openapi-parity.test.js` passed 2/2 |
| `git diff --check` | PASS |
| `npm run build:ci` | PASS |
| PostgreSQL migrations/integration | PASS: local Compose schema check and adapter draft/save/publish/read cycle |
| Frontend unit test suite | NOT EXECUTED as passing evidence |
| `e2e/authoring-security.spec.ts` | PASS: 1/1; CSRF rejection and stale revision conflict |
| `e2e/announcement-authoring.spec.ts` | Earlier PASS: 5/5; later rerun exposed test-state/concurrency issues and is not yet a final passing run |

The sandbox initially blocked the HTTP test's loopback bind with `EPERM`; that run is recorded as blocked, and the same test passed only after an explicitly elevated execution.

PostgreSQL follow-up verification completed after starting the local `song-site-postgres-1` container: the backend PostgreSQL schema check passed, the authoring adapter completed a draft/save/publish/read cycle, and the local content was restored to the initial migrated version through an audited publication. Browser qualification then found and corrected a PostgreSQL concurrency edge case where discarded versions were incorrectly considered current; final backend and browser reruns remain required.

## 13. Explicit non-claims

This plan does not claim production Entra authorization, production deployment, complete PostgreSQL clean/upgrade/repeat migration evidence, or full WP-039/WP-041 completion. The Announcement editor is implemented locally, but WP-038/WP-039 remain open until final browser and database qualification passes are recorded.
