# Authoring and Development Identity Work Packages

- Status: Local implementation and qualification in progress; WP-035/WP-036 and the Announcement slice are functional locally, while production Entra qualification and full release evidence remain incomplete
- Date: 2026-10-13
- Sequence: `WP-035` through `WP-041`

These packages decompose the proposed decisions in `ADR-0035`, `ADR-0036`, and `ADR-0037`. Approval of an ADR and completion of a work package are separate events.

## WP-035: Secure Local Development Mode

**Status:** Implemented locally; acceptance evidence recorded in `backend/auth.test.js` and `backend/server-security.test.js`. Production Entra integration is not included.

### Scope and non-goals

Implement the local-only authentication provider, fixed identity fixtures, session lifecycle, startup safeguards, and visible development-identity state. Preserve `Skip SSO` as Guest Mode. This package does not validate Entra tokens, create production users, or grant permissions through the frontend.

### Referenced ADRs

`ADR-0005`, `ADR-0019`, `ADR-0032`, `ADR-0035`.

### Functional and technical requirements

- Add explicit `AUTH_MODE` selection with guest/public behavior, `development`, and `entra` provider boundaries.
- Define fixed author, publisher, read-only, inactive, and denied fixtures in backend-owned local/test configuration.
- Issue an opaque signed `HttpOnly`, `SameSite=Strict` local session and support expiry, logout, and fixture switching.
- Add `GET /api/v1/session` and local-only session start/end operations OpenAPI-first.
- Display the active Development Mode identity and roles/permissions in the Angular shell without treating them as authority.
- Keep all tests runnable without Entra credentials.

### Acceptance criteria

- Guest Skip SSO remains read-only.
- An authorized fixture can establish a local session; denied fixtures cannot perform protected mutations.
- The backend refuses unsafe production, deployment, listener, origin, or signing-key configurations.
- No client-provided identity field, role, permission, or arbitrary header grants access.

### API and database changes

Add versioned session endpoints and schemas. A database is not required for fixed fixtures; session storage may be signed/stateless or local ephemeral storage after threat review. Do not insert fixtures into production identity tables.

### Security requirements

Loopback by default; explicit isolated-container override only in `development`/`test`; CSRF and same-origin protection; signed session; safe cookie settings; no token/session logging; fail-closed startup; production rejection of development sessions.

### Tests and verification evidence

Unit tests for configuration guards and fixture resolution; API tests for `401`, `403`, expiry, logout, CSRF, fixture switching, and unsafe startup; browser test showing the development identity badge. Record commands and results in the implementation pull request.

### Dependencies

Product approval of `ADR-0035`, initial fixture roles, cookie/session duration, and Compose policy.

### Definition of Done

OpenAPI, middleware/provider implementation, local configuration example, UI identity indicator, negative tests, startup tests, and local runbook agree; no production path accepts the development provider.

## WP-036: Backend Principal and Permission Enforcement

**Status:** Implemented locally for current mutation routes; OpenAPI parity and route-protection regression evidence pass locally. Production qualification remains outstanding.

### Scope and non-goals

Create one trusted principal/permission boundary and apply it to existing protected mutations. Replace the automatic non-production allow path. This package does not build authoring persistence or finish Entra integration.

### Referenced ADRs

`ADR-0005`, `ADR-0015`, `ADR-0017`, `ADR-0019`, `ADR-0029`, `ADR-0032`, `ADR-0035`.

### Functional and technical requirements

- Define a provider-neutral principal with provider, issuer, subject, local user ID where applicable, active state, roles, permissions, and scopes.
- Add authentication and permission middleware with consistent `401`/`403` error envelopes.
- Apply permissions to task, training, Journey compatibility, leadership, home, announcement, and Song-link mutations.
- Remove `NODE_ENV !== production` as an authorization decision.
- Plan controlled retirement of `X-Admin-Key`; do not remove it until approved callers and replacement tests exist.
- Attribute protected writes to the server-resolved principal.

### Acceptance criteria

- Every mutation has an explicit permission and rejects guest/denied principals.
- Development fixtures exercise allowed and denied paths using the same middleware.
- Existing public GET behavior remains compatible.
- No UI state or request payload controls the authorization result.

### API and database changes

Update OpenAPI security and stable error responses for every mutation. Add normalized identity/RBAC/audit migrations only after the relevant proposed ADRs are approved; do not treat the current `users.role` column as sufficient.

### Security requirements

Deny by default; resource/page scope after permission checks; safe error detail; audit sensitive writes and denials where approved; no credential or claim logging; CORS allow-list for deployed origins.

### Tests and verification evidence

Route inventory test proving every mutation has middleware; unauthenticated, forbidden, malformed, not-found, cross-scope, and authorized tests; SQLite/PostgreSQL behavior checks where persistence changes.

### Dependencies

`WP-035`; approval of initial permissions and temporary-key retirement strategy. Production claim mapping remains dependent on `WP-041`.

### Definition of Done

All current mutations are fail-closed through the shared boundary, OpenAPI matches runtime routes, negative tests pass, and temporary controls are either retired with evidence or explicitly time-bounded.

## WP-037: Authoring API and Persistence Foundation

**Status:** Announcement lifecycle implemented for SQLite and PostgreSQL; local PostgreSQL integration and repeat-migration evidence are recorded, but production migration-ledger qualification remains outstanding.

### Scope and non-goals

Implement shared content documents, versions, drafts, audit events, concurrency, and page-adapter contracts. This package does not implement a page editor or generic arbitrary-HTML CMS.

### Referenced ADRs

`ADR-0002`, `ADR-0004`, `ADR-0020`, `ADR-0025`, `ADR-0036`, `ADR-0037`.

### Functional and technical requirements

- Define document, version, draft, audit, validation-error, and conflict contracts OpenAPI-first.
- Implement Save, protected draft read, Preview validation, Publish, Discard, version list, and restore operations.
- Register page-specific schema/adapter definitions by stable page key and schema version.
- Enforce optimistic concurrency using the approved ETag or expected-version mechanism.
- Keep public published reads isolated from draft/history data.

### Acceptance criteria

- Save does not affect published reads.
- Publish atomically changes the current published pointer and keeps history immutable.
- Stale writes return the approved conflict response without lost updates.
- Restore creates a new draft and Discard retains required audit metadata.

### API and database changes

Add `/api/v1/content/pages/{pageKey}` and `/api/v1/authoring/pages/...` resource families. Add equivalent versioned SQLite and PostgreSQL migrations for documents, versions/drafts, and audit events, including constraints and indexes. Add migration-ledger support before production promotion.

### Security requirements

Backend edit/publish/restore/history permissions; server-side actor attribution; draft confidentiality; validated page keys and schema versions; bounded payloads; safe rich-text/URL/media policy; append-only audit through ordinary roles.

### Tests and verification evidence

State-machine unit tests; route security/validation tests; concurrent-editor tests; transaction rollback tests; SQLite/PostgreSQL migration and adapter parity tests; OpenAPI route/response conformance.

### Dependencies

`WP-036`; approval of `ADR-0036`, `ADR-0037`, concurrency response, draft multiplicity, retention, and publication role policy.

### Definition of Done

The shared lifecycle works for a test page adapter on both databases, contract and migrations are repeatable, security negatives pass, and no public endpoint exposes non-published content.

## WP-038: Announcement Page Editor

**Status:** Implemented locally for the Announcement slice; browser qualification is in progress and production release qualification remains outstanding.

### Scope and non-goals

Migrate the dedicated `/announcement` page's managed content and add its page-specific editor while preserving the public layout. Dashboard quick announcements remain a separate domain. This package does not add long-term binary uploads or edit unrelated pages.

### Referenced ADRs

`ADR-0023`, `ADR-0025`, `ADR-0034`, `ADR-0036`, `ADR-0037`.

### Functional and technical requirements

- Define typed hero, carousel, training, notice, and reminder schemas.
- Migrate current hardcoded values into an initial published version with stable IDs/order.
- Render published content through the existing page layout.
- Add section-specific controls for text, validated links, media references, ordering, and active state.
- Implement explicit Save, Preview, Publish, Cancel, and Discard interactions and loading/error/empty/conflict states.

### Acceptance criteria

- Guest/public rendering remains visually and behaviorally compatible.
- Placeholder `#` links cannot be published.
- Empty carousel data cannot cause modulo-by-zero or navigation errors.
- An editor can save/preview but cannot publish without publish permission.

### API and database changes

Add the Announcement page adapter and explicit OpenAPI component schemas; seed/import an initial published document through versioned migrations or an idempotent migration operation. Existing `/api/home/announcements` remains unchanged.

### Security requirements

No arbitrary HTML; URL allow/deny policy; media-reference validation; server-enforced page permissions; audit and concurrency inherited from `WP-037`.

### Tests and verification evidence

Implemented evidence: `src/app/announcement/announcement-editor.component.*` provides section-specific hero, congratulations, training, notice, reminder, ordering, add/remove, preview, save, publish, discard, restore, validation, unsaved-change, and permission controls. `e2e/announcement-authoring.spec.ts` contains Guest, Author, validation, Publisher, and restore journeys; an earlier complete run passed 5/5 before the later deterministic-state fixes. The focused rerun exposed and fixed PostgreSQL discarded-version concurrency handling; a final full rerun remains required. API CSRF/conflict acceptance passes in `e2e/authoring-security.spec.ts`.

### Dependencies

`WP-037`; approval of managed/static field inventory, rich-text policy, roles, and initial media strategy.

### Definition of Done

The dedicated page no longer reads managed values from `announcement.ts`/`announcement.html`, public behavior is preserved, lifecycle/security tests pass, and documentation distinguishes this page from dashboard announcements.

## WP-039: Draft, Preview, Publication, and Recovery Qualification

**Status:** In progress. Backend lifecycle tests pass for validation, immutable versions, stale conflicts, restore audit, expiry, production development-auth rejection, and route/OpenAPI parity. Browser and disposable-PostgreSQL qualification evidence is not yet complete.

### Scope and non-goals

Qualify the shared lifecycle against failure, concurrency, recovery, audit, and operational requirements. This is not another editor implementation.

### Referenced ADRs

`ADR-0020`, `ADR-0021`, `ADR-0036`, `ADR-0037`.

### Functional and technical requirements

- Finalize conflict UX and API semantics.
- Verify atomic publication, failed-publication rollback, immutable history, restore-to-new-draft, and Discard retention.
- Define operational metrics/logging for publication failures and conflicts without content leakage.
- Document backup/restore and migration/forward-fix procedures.

### Acceptance criteria

- Concurrent editors cannot silently overwrite each other.
- A failed Publish leaves the previous published version available.
- Authorized recovery is attributable and produces a new version chain.
- Audit and version retention follow an approved policy.

### API and database changes

Refine lifecycle errors and correlation identifiers; add approved retention/archive metadata or indexes. No breaking contract change without versioning or migration approval.

### Security requirements

History and audit access are permission-protected; ordinary authors cannot rewrite audit/history; logs exclude content payloads, tokens, and session secrets.

### Tests and verification evidence

Concurrent integration tests against PostgreSQL; fault-injection transaction tests; recovery drill; retention test; browser conflict and unsaved-change tests; evidence retained per release policy.

### Dependencies

`WP-037`, preferably `WP-038` as the representative real page; approval of retention, RTO/RPO, and audit ownership.

### Definition of Done

Lifecycle behavior is verified under concurrency and failure, recovery is documented and exercised, and release evidence is retained.

## WP-040: Leadership and Selected-Page Authoring Expansion

### Scope and non-goals

Apply the framework to grouped leadership content, then to product-approved selected pages. Organizational-chart authoring and transactional Journey/contact/user data remain out of scope.

### Referenced ADRs

`ADR-0011`, `ADR-0025`, `ADR-0027`, `ADR-0029`, `ADR-0036`, `ADR-0037`.

### Functional and technical requirements

- Create a leadership schema and tailored person/group/reorder editor preserving the current `/atcp-song` layout.
- Reconcile `leadership_sections` and `leadership_members` before migration; select one authoritative published representation.
- Remove or isolate withdrawn org-chart runtime routes, seed data, methods, and tests.
- Inventory Home, Song Links, About Us, Technologies, Song Bench, and other hardcoded pages; approve managed fields individually.
- Reuse lifecycle controls while implementing page-specific editors.

### Acceptance criteria

- Existing grouped leadership public reads remain compatible.
- Guests and ordinary members cannot mutate leadership.
- Editors and publishers receive only approved section/page capability.
- No selected page is migrated without content ownership, schema, permission, migration, and tests.

### API and database changes

Add typed leadership/selected-page adapters and migrations. Retire direct-to-live compatibility writes only through an approved deprecation plan. Remove org-chart contract/runtime artifacts through a separate reviewed cleanup change.

### Security requirements

Page/section scope, edit/publish separation, link/media validation, audit, concurrency, and safe nested-payload validation. External Figma asset URLs require an approved durable-media decision.

### Tests and verification evidence

Leadership adapter parity and nested validation; public layout regression; denied/authorized/publish tests; compatibility and migration tests; per-page browser flows.

### Dependencies

`WP-039`; approval of leadership source of truth, editor/publisher roles, selected-page order, and binary storage policy where uploads are needed.

### Definition of Done

Each migrated page has an approved inventory, typed adapter/editor, preserved public layout, secure lifecycle, parity tests, and explicit retirement evidence for superseded hardcoded/live-write paths.

## WP-041: Production Entra Integration and Release Qualification

### Scope and non-goals

Complete Production Mode bearer-token validation, identity reconciliation, claim/role mapping, deployment configuration, and release evidence. Do not expose Development Mode or treat local fixtures as tenant configuration.

### Referenced ADRs

`ADR-0019`, `ADR-0020`, `ADR-0021`, `ADR-0028`, `ADR-0029`, `ADR-0031`, `ADR-0032`, `ADR-0033`, `ADR-0035`.

### Functional and technical requirements

- Configure approved SPA/API registrations, scopes, app roles/groups, origins, and redirect URIs.
- Acquire API tokens in Angular and attach them only to the approved API origin.
- Validate signature, issuer, tenant, audience, expiry, scope, and required claims server-side.
- Reconcile stable identities and approved role mappings; support deactivation and role-change propagation.
- Disable/retire the temporary admin key and prove Development Mode is unavailable.
- Complete protected staging/production deployment, migration, smoke, rollback/forward-fix, and monitoring gates.

### Acceptance criteria

- Approved users receive only mapped permissions; unmapped/invalid tokens fail closed.
- Guest public reads remain available as approved.
- Production startup rejects Development Mode and development cookies.
- Authoring Save/Publish/audit behavior works through Entra in staging before production promotion.

### API and database changes

Finalize Entra security schemes and session/me contract; add normalized identity/RBAC/audit migrations and reconciliation metadata. No client secret is required for the SPA; deployment secrets remain external.

### Security requirements

Least privilege, HTTPS, exact redirect origins, token validation, key rotation/JWKS handling, no token logging, CORS allow-list, deprovisioning, break-glass approval, negative tests, and security review.

### Tests and verification evidence

Local verifier tests use isolated signing fixtures; staging tests use the approved tenant. Cover invalid/expired/wrong-tenant/wrong-audience/missing-scope/unmapped/forbidden tokens, role changes, logout, silent acquisition, interactive fallback, and post-deployment authoring smoke tests.

### Dependencies

Can be deferred while `WP-035` through `WP-040` proceed. Requires organizational Entra access, approved app registrations/claims, owners, environments, and deployment/operations decisions.

### Definition of Done

Production authentication and authorization are verified in protected staging, temporary bypasses are retired, deployment gates pass, operational ownership is documented, and no development identity path is reachable in deployed environments.

## Proposed sequence and independence

1. `WP-035` Secure Local Development Mode.
2. `WP-036` Backend Principal and Permission Enforcement.
3. `WP-037` Authoring API and Persistence Foundation.
4. `WP-038` Announcement Page Editor.
5. `WP-039` Draft/Preview/Publication/Recovery Qualification.
6. `WP-040` Leadership and Selected-Page Expansion.
7. `WP-041` Production Entra Integration and Release Qualification.

`WP-035` through most of `WP-040` can proceed without access to the organization's Entra configuration after the proposed ADRs and product decisions are approved. Entra-specific registration, claim mapping, tenant integration, and production release qualification in `WP-041` remain blocked by organizational access.
