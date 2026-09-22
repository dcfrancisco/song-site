# ADR-0010: Initial OpenAPI and SQLite Implementation

- Status: Accepted and implemented
- Date: 2026-09-18

## Context

The project needed a concrete first implementation of the OpenAPI-first and local-database decisions. Before this work, task and training data were read and mutated directly in JSON files, and there was no interactive local contract documentation.

## Decision

Implement the first backend slice with:

- `docs/openapi/song-site.yaml` as the contract for the current Journey and training-task endpoints;
- a local SQLite database at `.local/song-site.sqlite`;
- a versioned initial migration under `backend/migrations/`;
- migration-backed task and training records in `backend/migrations/004-content-data.sql`;
- explicit local database lifecycle commands through `backend/scripts/db-cli.js`;
- a repository module in `backend/database.js` behind the existing Express routes;
- local Swagger UI at `/api-docs`, enabled only when `NODE_ENV=development` and `SWAGGER_UI=true`;
- production exclusion of the Swagger route.

Existing frontend URL paths and task response shapes remain compatible during this migration.

## Verification

- SQLite schema creation and JSON seed completed successfully.
- Task reads, status updates, progress calculation, and task creation were exercised.
- Local Swagger UI returned HTTP 200.
- Production `/api-docs/` returned HTTP 404.

## Consequences

The project now has a usable local API contract and durable local persistence without requiring a database server. PostgreSQL support, authentication, RBAC, the complete domain schema, and full API contract validation remain follow-up work and must not be marked complete by this ADR. The lifecycle command details are governed by ADR-0013.
