# ADR-0004: Database Migrations and Environment Parity

- Status: Accepted; implementation split between SQLite and planned PostgreSQL work
- Date: 2026-09-18

## Context

The project needs a repeatable way to update local and production databases without manually editing tables or JSON files. Production and local development use different database engines, so migration behavior must be explicit.

## Decision

Adopt a migration-capable TypeScript database layer and make migrations part of the release process:

1. Define schema changes in version-controlled migration files.
2. Apply migrations automatically to local SQLite through a documented command.
3. Apply the same logical migration to PostgreSQL in CI and production deployment.
4. Run the migration against a disposable PostgreSQL database in CI before release.
5. Require backward-compatible database changes when frontend and backend deploy independently.
6. Back up production before destructive migrations and document rollback or forward-fix steps.

The implementation should use a tool that supports both SQLite and PostgreSQL while keeping dialect-specific SQL visible when necessary. A single migration command must select the database from `DATABASE_URL`; developers should not edit production manually. The current repository has only the SQLite implementation; ADR-0016 defines the remaining PostgreSQL work.

## Consequences

Database changes become reviewable and repeatable. Because SQLite and PostgreSQL are not identical, CI must exercise PostgreSQL and migrations should avoid silent type or constraint differences.
