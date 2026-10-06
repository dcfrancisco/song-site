# ADR-0034: API-Backed Announcement Page Content

- Status: Proposed for project-owner review
- Date: 2026-10-06
- Owner: To be assigned
- Related work packages: `WP-024`, `WP-018`, `WP-033`
- Related ADRs: `ADR-0002`, `ADR-0011`, `ADR-0014`, `ADR-0023`, `ADR-0022`

## Context

The dedicated `/announcement` page currently stores its congratulations carousel, training content, and notice copy in Angular component and template files. The four congratulations images are hardcoded in `src/app/announcement/announcement.ts` and are not managed through an API.

The home dashboard already exposes `GET /api/home/announcements` backed by the `home_announcements` database domain. Its current records support dashboard cards with an icon, title, and body, while the dedicated page has no API-backed content contract. The dedicated page contains several sections with different data shapes: a congratulations carousel, important trainings, new features and important notices, and a reminder. Treating all of those sections as dashboard announcement rows would make the existing table a catch-all content store.

The current dedicated page sources these sections locally: certificate records and image paths, including `congrats1.png` through `congrats4.png`, and the `trainings` array are defined in `src/app/announcement/announcement.ts`; the hero, section headings, notice content, and reminder copy are defined in `src/app/announcement/announcement.html`. None of these sections currently comes from an API or database.

The application must also preserve the existing announcement response shape during implementation. API changes remain OpenAPI-first, database changes must use versioned migrations, and production content writes require identity-backed authorization, validation, audit history, and publication controls. The existing temporary API-key bridge is not a production authorization model.

## Decision

Create one dedicated page-level announcement API for the `/announcement` route. The API returns and updates the page content as one aggregate response; it does not require a separate HTTP call for each section. The response uses explicit section keys with section-specific item shapes:

- `hero` for page-level heading and supporting copy when that content becomes managed;
- `carousel` for congratulations and other visual announcement slides;
- `trainings` for training titles, descriptions, and destination links;
- `notices` for feature and notice content; and
- `reminder` for the page reminder content.

The `trainings` section must support the current fields used by the page: title, description, destination link, and link label. The `notices` section must support a notice title and body, and the `reminder` section must support its page-level copy. The hero and section headings may remain presentation configuration until the content-management model is finalized, but they are part of the page inventory and must not be silently omitted from the API boundary.

The exact endpoint and mutation payload will be defined OpenAPI-first, but the API boundary is a single page resource rather than separate carousel, training, notice, and reminder APIs. A section discriminator in the response and request model allows the backend to validate and persist each section according to its own shape without requiring separate client calls.

The existing `GET /api/home/announcements` endpoint and `home_announcements` table remain dedicated to dashboard announcement cards. They are not repurposed as the storage or API for the dedicated announcement page.

Carousel items will support, at minimum:

- a stable identifier;
- a content type, including `carousel`;
- title and body content;
- a media reference for the image or other supported visual asset;
- an optional destination link and link label;
- explicit display ordering;
- active/publication state; and
- timestamps where required by the persistence model.

The carousel model is intentionally reusable. Congratulations and certification slides are the first content set, but the API must also support future announcement slides without another schema or endpoint redesign.

The dedicated announcement page will eventually consume the aggregate API for its carousel, important trainings, notices, and reminder. Existing repository image files may be used as the initial media references; this ADR does not select long-term binary storage.

Implementation must:

1. Update the OpenAPI contract before or alongside the implementation.
2. Add versioned SQLite and PostgreSQL migrations for the dedicated page content and preserve existing dashboard announcement data.
3. Apply section-specific validation, ordering, active-state behavior, and response shapes consistently across database adapters.
4. Preserve compatibility for existing home announcement clients and keep their API separate from the page aggregate API.
5. Add focused backend and frontend tests for the new behavior and failure states.
6. Replace the dedicated page's hardcoded certificates, training records, notice content, and reminder copy only after the API contract and migrations are implemented.

## Consequences

This approach gives the dedicated announcement page one consistent API call while allowing each section to retain an appropriate schema. It avoids a network waterfall and avoids forcing the dashboard's simple announcement table to represent unrelated page content.

The dedicated page requires a new persistence design or dedicated page-content tables, in addition to carousel media and ordering metadata. SQLite/PostgreSQL parity, migration safety, OpenAPI compatibility, and test coverage become part of the implementation scope. The existing dashboard announcement schema remains unchanged except for unrelated approved work.

The shared endpoint does not by itself solve content governance. Identity-backed authorization, ownership, audit history, preview/staging, scheduling, and publication workflow remain required for production and are tracked through `WP-018` and `WP-033`. The temporary API-key gate must not be treated as the final control.

The aggregate API introduces a broader implementation scope than a carousel-only endpoint, but it prevents the page from developing several incompatible APIs. It also makes the current `Important Trainings` data an explicit managed section instead of leaving it as an untracked component-local array. Static page copy may still be staged separately, but the API boundary is prepared to manage all page sections consistently.

## Known implementation gaps

The current page does not yet implement this decision. The following gaps are explicitly in scope for `WP-024`:

- no dedicated announcement-page API, service, or OpenAPI contract exists;
- carousel records and the four repository image paths remain hardcoded in `announcement.ts`;
- the six Important Trainings records, including several placeholder `#` links, remain hardcoded in `announcement.ts`;
- hero copy, section headings, notices, and reminder copy remain hardcoded in `announcement.html`;
- carousel and training data have no stable identifiers, explicit ordering, active state, or publication metadata;
- the page has no loading, error, or empty states, and an empty carousel requires defensive handling before navigation or auto-slide logic runs; and
- `announcement.specs.ts` does not yet cover rendering, navigation, data loading, or failure states.

The shared navbar logo remains intentional static branding and is excluded from this content migration.

## Implementation boundary

This ADR records the architecture decision only. It does not add the API fields, database migrations, seed records, frontend integration, authorization, or content-management UI.

## Completion criteria

- The OpenAPI contract defines one page-level aggregate response with explicit, section-specific shapes.
- SQLite and PostgreSQL migrations persist the dedicated page sections without changing the meaning of existing dashboard announcements.
- A single page API request returns the required sections, with section-aware validation and update behavior.
- The dedicated announcement page loads the carousel, Important Trainings, notices, and reminder from the aggregate API with loading, empty, error, and invalid-media handling.
- Existing home announcement behavior remains functional through its existing API and table.
- Training links are validated and no placeholder destinations remain in managed content.
- Backend and frontend tests cover section validation, ordering, active state, aggregate response behavior, empty/error/loading states, and carousel rendering/navigation states.
- Production publication controls and identity-backed authorization are implemented before managed content writes are promoted beyond the temporary bridge.
