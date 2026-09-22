# ADR-0026: PostgreSQL Connection Setup

- Status: Accepted for connection setup; adapter and migration parity pending
- Date: 2026-09-18
- Owner: `danny.c.francisco`
- Related work packages: `WP-006`, `WP-015`, `WP-017`, `WP-018`

## Context

The backend currently runs through SQLite and Node `node:sqlite`. PostgreSQL is the production database target, but the repository did not yet have a PostgreSQL client, connection pool, environment contract, or connectivity check. The existing repository methods are synchronous SQLite methods, so selecting PostgreSQL for the API requires a separate adapter and an asynchronous boundary.

## Decision

Add PostgreSQL connectivity behind a dedicated `backend/postgres.js` module using the `pg` client pool. The connection is configured only from environment variables:

- `DB_DRIVER`: database selection, `sqlite` by default; `postgres` is reserved for the PostgreSQL adapter.
- `DATABASE_URL`: optional PostgreSQL connection string; when omitted, the explicit `PG*` settings are used.
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`: explicit PostgreSQL connection settings; `PGPASSWORD` MUST remain in local environment configuration or a secret manager.
- `PG_POOL_MAX`: optional pool size, default `10`.
- `PG_CONNECTION_TIMEOUT_MS`: optional connection timeout, default `5000`.
- `PG_IDLE_TIMEOUT_MS`: optional idle timeout, default `30000`.
- `PGSSL=true`: enables TLS with certificate verification disabled for the temporary setup; production certificate validation must be defined before deployment.

`backend/scripts/postgres-check.js` and `npm run db:postgres:check` perform a non-destructive `SELECT 1` connectivity check when `DB_DRIVER=postgres`. SQLite remains the default local runtime until the PostgreSQL adapter, portable migrations, API parity, CI service, and deployment configuration are complete. If `DB_DRIVER=postgres` is selected before the adapter exists, the SQLite repository fails fast with a configuration error rather than silently using SQLite.

The connection string and credentials MUST NOT be logged or committed. A PostgreSQL pool MUST be closed during process shutdown and test teardown.

## Consequences

Developers and CI can verify PostgreSQL connectivity without changing the local SQLite workflow. The connection module establishes the infrastructure boundary but does not claim PostgreSQL API support: existing synchronous repositories still use SQLite, and the current SQLite migrations are not yet proven portable to PostgreSQL.

The next implementation work is to add a PostgreSQL repository adapter or a shared async persistence interface, convert migrations with PostgreSQL-compatible syntax where needed, and run API integration tests against PostgreSQL before changing the production database selection.

## Validation

Without `DATABASE_URL`, `npm run db:postgres:check` fails clearly and without attempting a connection. With a valid URL, it must report only connection readiness and never print credentials.
