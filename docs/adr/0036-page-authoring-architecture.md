# ADR-0036: Page Authoring Architecture

- Status: Accepted for implementation; announcement first slice in progress
- Date: 2026-10-13
- Owner: To be assigned
- Related work packages: `WP-037`, `WP-038`, `WP-040`
- Related ADRs: `ADR-0002`, `ADR-0005`, `ADR-0011`, `ADR-0023`, `ADR-0025`, `ADR-0029`, `ADR-0034`, `ADR-0037`

## Context

Song Site mixes API-backed content with component-local content. Home spotlight, dashboard announcements, leadership groups, and Song links have read APIs. The dedicated Announcement page, About Us, Technologies, Song Bench landing copy, and parts of leadership presentation remain hardcoded in Angular files. Existing write routes update live rows directly, have no draft/preview lifecycle, and use a temporary key or the non-production bypass rather than identity-backed permissions.

The product needs authoring for selected pages while preserving existing public layouts. Announcement sections, leadership structures, links, and narrative pages have different shapes and should not be forced into one generic form or catch-all table.

## Decision

Adopt a hybrid architecture:

- a reusable authoring shell and backend lifecycle for identity, permissions, edit-mode state, dirty-state handling, validation summaries, optimistic concurrency, Save, Preview, Publish, Cancel, Discard, audit, and version navigation; and
- page-specific content schemas, validators, adapters, and editor components that preserve each page's domain and layout.

The shared framework must not implement arbitrary HTML editing. Managed rich text, when approved, uses a constrained document format and sanitization policy. Branding, layout, Angular behavior, and intentionally static labels remain code unless a page inventory explicitly marks them as managed content.

### User experience

Pages are read-only by default. After `GET /api/v1/session` reports an effective page permission, an authorized user may activate Edit Mode. Edit Mode displays the active identity/mode, draft status, validation state, unsaved-change warning, and section-specific controls without changing the normal public layout.

Operation semantics are explicit:

- **Save** validates and persists a draft without changing public content.
- **Preview** renders the persisted or current validated draft through the normal page renderer and is visible only to authorized users.
- **Publish** performs final validation and atomically promotes a specific draft version.
- **Cancel** exits the current editing interaction and drops unsaved browser changes while preserving the last saved draft.
- **Discard** confirms and abandons the saved draft; it never deletes published history.

### Page adapters

Each authorable page registers a stable page key, schema version, typed payload validator, permission keys, frontend renderer, and editor implementation. The first candidates are:

1. `announcement-page`: hero, carousel, trainings, notices, and reminder, aligned with `ADR-0034`.
2. `leadership`: market, practice, capability, and enablement sections with tailored person/group/reorder controls; organizational-chart authoring remains excluded by `ADR-0027`.
3. `home`: spotlight and quick-announcement sections after the duplicate content-table strategy is resolved.
4. `song-links`, followed by product-approved narrative pages such as About Us or Technologies.

Journey status, user administration, contact submissions, and other transactional domains are not page content and do not use this authoring framework.

### API boundary

New APIs are versioned and OpenAPI-first. The proposed resource family is:

- `GET /api/v1/content/pages/{pageKey}` for the currently published public representation;
- `GET /api/v1/authoring/pages/{pageKey}/draft`;
- `PUT /api/v1/authoring/pages/{pageKey}/draft` with `If-Match` or an equivalent expected-version field;
- `POST /api/v1/authoring/pages/{pageKey}/preview`;
- `POST /api/v1/authoring/pages/{pageKey}/publish`;
- `DELETE /api/v1/authoring/pages/{pageKey}/draft` for Discard;
- `GET /api/v1/authoring/pages/{pageKey}/versions`; and
- `POST /api/v1/authoring/pages/{pageKey}/versions/{versionId}/restore` to create a new draft from history.

Page-specific schemas remain explicit in OpenAPI using discriminators or separate named schemas. A generic `additionalProperties: true` payload is not sufficient for a mutation contract.

### Authorization

The backend enforces separate edit and publish permissions, scoped by page or content type. Initial proposed permissions are `content:{pageKey}:edit` and `content:{pageKey}:publish`; leadership may retain the narrower `leadership:edit` and `leadership:publish` names. Product owners must decide whether authors may publish their own drafts or whether separation of duties is required.

## Implementation evidence

The first backend slice is implemented for `announcement-page` in `backend/content/`, `backend/migrations/014-content-authoring.sql`, `backend/migrations-postgres/010-content-authoring.sql`, `backend/database.js`, `backend/postgres-database.js`, and `backend/server.js`. The public Announcement renderer now reads the published API representation. Section-specific editor controls and broader page expansion remain WP-038/WP-040 work.

## Consequences

Common behavior is implemented once while page editors remain usable and type-safe. Adding a page requires a schema, adapter, permissions, migration/seed plan, editor, and tests rather than only toggling a generic WYSIWYG component. Public page rendering can migrate incrementally and keep existing compatibility reads until consumers switch.

The architecture introduces schema-version management, preview authorization, sanitization, asset governance, and adapter contracts. Long-term binary storage remains governed by `ADR-0025`.

## Trade-offs

- A fully generic editor is faster for plain fields but performs poorly for leadership hierarchy, ordered cards, and media-specific validation.
- Entirely page-specific implementations fit each page but duplicate lifecycle, security, audit, concurrency, and error handling.
- The hybrid approach has an upfront framework cost but keeps domain models explicit and avoids a catch-all content table or one universal form.

## Verification requirements

- Guest and read-only users see the unchanged published layout and no effective mutation capability.
- Every editor handles loading, empty, invalid, conflict, forbidden, network-failure, unsaved, saved-draft, preview, and published states.
- Save never changes public content; Publish changes it atomically.
- Cancel and Discard follow the documented distinct semantics.
- Invalid links, unsupported media, missing required fields, unsafe rich text, and invalid ordering fail with field/section errors.
- Backend negative tests cover unauthenticated, forbidden, malformed, stale-version, cross-page, and invalid-state operations.
- Existing public routes remain backward compatible during migration.

## Approval questions

- Which pages and sections are in the first authoring release?
- Are author and publisher separate roles?
- Which text fields require constrained rich text rather than plain text?
- Should page preview use the live route with an authorized draft context or a dedicated preview route?
- Which current headings and branding elements remain code-owned?

## Implementation boundary

This ADR documents a proposed architecture. It does not implement authoring APIs, schemas, persistence, editors, permissions, or publication behavior.
