# ADR-0011: Site API and Relational Data Model

- Status: Proposed
- Date: 2026-09-18

## Context

The site review found working UI areas for Home, ATCP Song leadership, Song links, Journey, My Journey, and Training Tracker. The current backend has task, training, leadership, home, and link endpoints, but only task data has begun moving to SQLite. A duplicate legacy server under `public/server.js` was also identified and has now been removed.

The site needs a single API boundary and a relational model that supports identity, RBAC, Journey ownership, Work Packages, status history, and managed content.

## Decision

Use the API and table inventory in [api-data-inventory.md](../api-data-inventory.md) as the planning baseline.

- Keep `/api/*` as a compatibility surface during migration.
- Add new domain APIs under `/api/v1`.
- Treat Journey, Work Packages, tasks, training, identity/RBAC, content, and audit history as separate relational boundaries.
- Use PostgreSQL as the production target and SQLite for local development, with migrations tested against both.
- Do not create a second production runtime; the backend service is the single API runtime.

## Consequences

The frontend can migrate incrementally while the target model becomes explicit. The project must decide ownership/team semantics, identity-provider claims, content-management permissions, and the migration mapping from JSON before the proposed tables become production schema.
