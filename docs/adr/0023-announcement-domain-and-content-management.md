# ADR-0023: Announcement Domain and Content Management

- Status: Proposed for project-owner review
- Date: 2026-09-18
- Owner: To be assigned
- Related work packages: `WP-011`, `WP-014`, `WP-024`

## Context

The application currently has two announcement experiences with different ownership and storage paths:

- The dashboard uses `GET /api/home/announcements`, which reads SQLite `announcements` rows populated by migration `004-content-data.sql`.
- The `/announcement` page contains certificates, training notices, links, and reminder copy directly in `src/app/announcement/announcement.ts` and `announcement.html`.

The dashboard content is database-backed. A temporary `PUT /api/home/announcements/:id` compatibility API now updates announcement rows. It validates JSON object payloads and, outside development, requires the `TEMP_CONTENT_API_KEY` / `X-Admin-Key` bridge; it is not identity-backed authorization and has no publication workflow, scheduling model, or audit trail. The dedicated page does not call the API and is not represented by the announcement table.

## Decision

Treat announcement content as a product-owned domain that must have one documented source-of-truth strategy before production content management is implemented.

The project owners must choose one of these bounded approaches:

1. **Unified announcement domain:** migrate dashboard cards and dedicated-page notices into versioned announcement records with type, title, body, icon/media, destination link, publication window, audience scope, author, and lifecycle status.
2. **Separate bounded content:** retain dashboard announcements and dedicated-page campaign/training content as separate domains, with explicit APIs, owners, schemas, and lifecycle rules for each.

Regardless of the choice:

- Migration-backed database rows remain the runtime source; JSON is not a runtime dependency.
- Content writes MUST require server-side authentication and content-management authorization.
- Published content MUST have validation, preview or staging controls, and audit history.
- The API contract and database migration MUST be updated together.
- Existing frontend response shapes MUST remain compatible during migration or be versioned under `/api/v1`.
- Static copy that is intentionally product UI, such as page headings and explanatory text, must be identified separately from managed announcements.

The first implementation decision, content owner, audience model, publication workflow, and retirement policy remain open for project-owner review.

## Consequences

A unified domain reduces duplicate authoring and makes publication and audit behavior consistent, but requires mapping certificates, training notices, and dashboard cards into a common model. Separate domains preserve their different presentation needs, but require multiple ownership and API contracts. Neither path is production-ready until write authorization, validation, auditability, and tests exist.

## Review questions

- Should dashboard cards and the dedicated page share one authoring workflow?
- Who owns announcement content and who may publish it?
- Which content requires audience targeting, start/end dates, or approval?
- Are certificates and training resources announcements, or separate content domains?
- What is the migration and retirement plan for the component-local arrays on the dedicated Announcement page?
