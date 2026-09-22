# ADR-0013: Local Database Lifecycle Commands

- Status: Accepted and implemented for SQLite local development
- Date: 2026-09-18

## Context

The project needs repeatable local database operations instead of requiring developers to know how the database module initializes itself. The current local database is SQLite, while PostgreSQL remains the production target.

## Decision

Expose database operations through the backend package scripts:

| Command | Behavior | Safety |
| --- | --- | --- |
| `npm run db:migrate` | Creates the current SQLite schema and reports the database path. | Non-destructive; current migration is applied during database initialization. |
| `npm run db:seed` | Initializes and seeds empty task tables from the legacy JSON files. | Idempotent for populated tables; does not overwrite existing rows. |
| `npm run db:check` | Opens the database and reports task/training row counts. | Read-only. |
| `npm run db:reset` | Removes the configured local SQLite database file. | Destructive; local data is lost and must be reseeded. |

The database path is controlled by `DATABASE_PATH`; local defaults go under `.local/`, which is ignored by Git. These scripts are intended for local SQLite use; the current implementation does not enforce a production guard on `db:reset`, so operators must not point it at production data. PostgreSQL migration and deployment commands must be added before production database rollout.

## Verification requirements

- Run `db:check` after local setup.
- Run `db:reset`, then `db:migrate` and `db:seed` only when intentionally rebuilding local data.
- Run the same logical migrations against PostgreSQL in CI before production support is marked complete.
- Never run `db:reset` against a production database.

## Consequences

Developers have a visible and repeatable local database workflow. The current implementation still has a deliberately small schema and must not be confused with the complete domain inventory in `WP-014`.