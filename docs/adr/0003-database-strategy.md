# ADR-0003: PostgreSQL in Production and SQLite Locally

- Status: Accepted; production integration pending
- Date: 2026-09-18

## Context

Production needs a durable, concurrent relational database. Local development should be simple, fast, and work without requiring every developer to run a database server. The current system stores mutable state in JSON files, which does not provide transactions, constraints, concurrent access, or reliable auditability.

## Decision

Use PostgreSQL as the production database. Use SQLite for local development and automated tests when the feature under test does not depend on PostgreSQL-specific behavior.

The persistence layer must keep the supported SQL surface portable. PostgreSQL remains the canonical compatibility target; CI must run integration tests against PostgreSQL so SQLite does not hide production-only failures.

Recommended local setup:

- a repository-local SQLite file outside Git, such as `.local/data/song-site.sqlite`;
- a `DATABASE_URL` environment variable for both environments;
- a disposable PostgreSQL service in CI and for developers who need production parity;
- no database credentials or data files committed to the repository.

The concrete PostgreSQL integration plan is defined by ADR-0016. Until `WP-017` is complete, the running backend supports SQLite only.

## Alternatives considered

- PostgreSQL everywhere: strongest parity, but higher local setup cost.
- JSON files: lowest setup cost, but unsuitable for concurrent, authorized, transactional application state.
- An embedded PostgreSQL substitute: better parity than SQLite, but more operational complexity than this project currently needs.

## Consequences

SQLite makes onboarding easy, but database-specific behavior must be tested explicitly. Schema design should avoid relying on SQLite-only typing or permissive constraints.
