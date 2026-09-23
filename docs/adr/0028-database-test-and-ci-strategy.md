# ADR-0028: PostgreSQL Compatibility, Test Layers, and CI Gates

- Status: Proposed for project-owner review
- Date: 2026-09-23
- Owner: To be assigned
- Related work package: `WP-029`
- Related ADRs: `ADR-0007`, `ADR-0008`, `ADR-0016`, `ADR-0017`, `ADR-0026`

## Context

Existing ADRs require frontend unit tests, Playwright coverage, backend integration tests, and PostgreSQL verification, but those requirements are not yet implemented as a CI pipeline. The repository currently has frontend test scripts and Playwright as a dependency, but no committed Playwright configuration or test workflow. Backend tests are not yet present, and the existing GitHub workflow is deployment-only.

SQLite is currently convenient for local development, but it is not fully compatible with the production database contract. Production is required to use PostgreSQL 14 or newer with the `pgvector` extension available. The current PostgreSQL work is limited to connection setup and an incomplete adapter/migration path; SQLite remains the active local runtime.

## Decision

Use PostgreSQL 14+ with `pgvector` as the production compatibility baseline. The production database, migrations, repository adapter, and integration tests must be validated against the same PostgreSQL major-version family and an image/provider where the required `vector` extension can be enabled.

Use the following local-development options, in priority order:

1. **Recommended:** a disposable Docker/Podman PostgreSQL 14+ instance with `pgvector`, seeded from the same migrations used by CI.
2. **Supported alternative:** a developer-managed or shared PostgreSQL 14+ instance with an isolated database/schema and a documented reset/seed workflow.
3. **Fast feedback only:** SQLite for frontend tests, repository unit tests, and lightweight local development where PostgreSQL-specific behavior is not under test. SQLite must not be treated as proof of PostgreSQL compatibility or as the production data path.

The implementation must provide separate, explicit database commands/configuration for SQLite and PostgreSQL. A PostgreSQL-selected environment must fail fast rather than silently falling back to SQLite.

The CI pipeline must contain these gates:

- frontend unit tests and production build;
- backend unit tests for pure repository/service and validation behavior;
- backend integration tests against disposable PostgreSQL 14+ with `pgvector`, covering migrations, constraints, transactions, API routes, and representative CRUD flows;
- SQLite compatibility checks where SQLite remains supported;
- focused Playwright FED smoke tests on pull requests, using isolated test data and a controlled API;
- the full Playwright suite for release or protected-branch validation;
- migration and API smoke checks before deployment.

Playwright is the browser-level test for user-visible FED behavior. It does not replace unit tests or API/database integration tests. Test artifacts, traces, screenshots, and server logs must be retained for failed CI jobs.

## Recommendation

Adopt PostgreSQL-first integration testing early, while retaining SQLite only as an explicitly limited fast local option. This reduces dialect drift and makes local behavior closer to production. If maintaining two database adapters becomes more costly than its value, the project should consider PostgreSQL with `pgvector` as the default local development database and retire SQLite after migration parity and developer onboarding are stable.

## Consequences

CI becomes slower and requires a disposable PostgreSQL service, but database compatibility failures are found before deployment. Developers have a fast SQLite path and a production-faithful PostgreSQL path, with clear limits on what each proves.

The work requires test isolation, migration lifecycle support, seeded fixtures, environment configuration, and deployment checks. The feature is not complete merely because `npm test` or the frontend build passes.

## Completion criteria

- PostgreSQL 14+ with `pgvector` is documented and verified in local development and CI.
- The backend adapter and migrations pass against PostgreSQL and any retained SQLite path.
- Frontend unit tests, backend unit tests, backend PostgreSQL integration tests, and Playwright FED tests run through repeatable CI commands.
- CI blocks merges or releases on required failures and publishes useful artifacts.
- Deployment runs only after database migration, API smoke, frontend build, and focused browser checks pass.
