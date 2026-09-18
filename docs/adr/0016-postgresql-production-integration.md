# ADR-0016: PostgreSQL Production Integration

- Status: Accepted as implementation plan
- Date: 2026-09-18
- Owner: `danny.c.francisco`

## Context

The architecture targets PostgreSQL for production and SQLite for local development. The current backend has a working SQLite repository and versioned SQL migrations, but it has no PostgreSQL driver, adapter, `DATABASE_URL` selection, PostgreSQL migration command, or PostgreSQL CI service. Production PostgreSQL support must therefore be planned explicitly without being represented as implemented.

## Decision

Implement PostgreSQL behind the existing repository boundary under `WP-017`.

### Runtime selection

- Local development defaults to `DATABASE_PATH=.local/song-site.sqlite` and Node `node:sqlite`.
- PostgreSQL environments use a secret `DATABASE_URL` supplied by the deployment platform.
- The adapter selection must be explicit and fail fast for unsupported or ambiguous configuration.
- Application routes must continue to call repository methods rather than issuing database-specific SQL.

### Schema and migrations

- Keep migrations versioned and ordered under `backend/migrations/`.
- Make the logical schema portable across SQLite and PostgreSQL; isolate dialect-specific SQL in named migrations or adapter code.
- Add a migration ledger so each environment records applied versions.
- Test every migration against a disposable PostgreSQL instance before release.
- Preserve the current seed inputs for local/demo initialization, while production seed and content import must be an explicit deployment operation.

### Delivery and operations

- Add a PostgreSQL driver and repository adapter without changing API response contracts.
- Add CI services and integration tests for PostgreSQL, including foreign keys, constraints, transactions, and status updates.
- Provision `DATABASE_URL` through deployment secrets only; never commit credentials.
- Back up production before destructive migrations.
- Use backward-compatible expand/migrate/contract changes for independently deployed frontend and backend releases.
- Prefer a forward fix over automated destructive rollback when data has been written under a new schema.

## Consequences

SQLite remains fast and simple for local development, while PostgreSQL becomes the production compatibility gate. The project will carry two database adapters and must test both. Until the adapter, CI, deployment configuration, and operational runbook exist, PostgreSQL support remains incomplete and production must not be presented as database-ready.

## Verification required before completion

- `DATABASE_URL` connects successfully in a disposable PostgreSQL environment.
- All versioned migrations apply from an empty database and from a representative existing database.
- Seed/import behavior is explicit and repeatable.
- Backend API smoke tests pass against PostgreSQL.
- CI exercises constraints, transactions, status updates, and concurrent access.
- Backup, migration, rollback/forward-fix, and secret-rotation procedures are documented.