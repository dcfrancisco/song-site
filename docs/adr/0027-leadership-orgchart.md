# ADR-0027: Leadership Organizational Chart

- Status: Proposed for project-owner review
- Date: 2026-09-23
- Owner: To be assigned
- Related work packages: `WP-028`, `WP-030`

## Context

The requested Leadership Organizational Chart is a presentation of leadership relationships, roles, reporting levels, and profile images. The supplied image is only a visual mock for the chart structure; its logo, branding label, colors, typography, and footer content are not part of this feature's scope.

The repository already has a leadership content boundary:

- `GET /api/leadership` returns leadership data grouped by section.
- `PUT /api/leadership/:section/:id` updates an existing leadership item.
- Local SQLite stores the compatibility records in `leadership_sections`.
- The PostgreSQL adapter has the corresponding `leadership_members` table.
- The current frontend consumes the API on `/atcp-song` and renders market leads, practice leads, capability leads, and enablement champions.

The current implementation is not an organizational-chart feature. It has no org-chart route or component, no explicit parent/child relationship in the SQLite compatibility table, and no frontend CRUD or data-entry surface for leadership content. The current update endpoint is also update-only: it does not create or delete leadership items.

## Decision

Implement the first Leadership Organizational Chart as a feature of the existing leadership domain. Do not create a duplicate leadership API or an unrelated content table for the initial implementation.

The implementation work package must:

- define the org-chart response shape and node relationship semantics before coding;
- reuse the existing leadership API boundary where its current contract is sufficient;
- extend the existing persistence/API boundary only where required for chart nodes, ordering, parent relationships, or full CRUD;
- preserve the existing `/atcp-song` leadership response and behavior unless an explicitly versioned contract is approved;
- add the frontend org-chart presentation and the authorized data-entry experience;
- require authentication, authorization, input validation, auditability, and automated tests before treating leadership mutation as production-ready;
- apply the SSO-compatible guest/editor policy defined by `ADR-0029`;
- keep media references as URLs or asset metadata rather than embedding binary files in relational records, consistent with ADR-0025.

The existing `leadership_sections` table may remain a compatibility representation during migration. A normalized hierarchy should be introduced only if the agreed chart requirements need querying, referential integrity, or reporting that the compatibility payload cannot safely provide.

## Consequences

The project avoids a second leadership data source and can build on the existing API/database work. The current API and table are evidence of an existing foundation, not evidence that the org-chart feature or its management experience is implemented.

The feature remains blocked from implementation completion until the organization confirms the chart hierarchy, ownership, editor permissions, create/update/delete behavior, image ownership, and whether the chart is a public content page or an authenticated product experience.

## Verification

The work package is complete only when the following are present:

- an approved API/OpenAPI contract for chart retrieval and mutations;
- a working chart UI backed by the API;
- an authorized frontend data-entry/editor flow, if content is managed in FED;
- persistence and migration coverage for the selected representation;
- negative authorization and validation tests;
- an update/runbook path for leadership data;
- no claim that the feature is implemented based only on the current leadership API, tables, or static reference image.
