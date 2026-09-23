# Architecture Documentation

This directory contains architecture decision records (ADRs), API contracts, and implementation notes for Song Site.

## ADR index

- [ADR-0001: Architecture baseline](adr/0001-architecture-baseline.md) - Accepted
- [ADR-0002: OpenAPI-first API design](adr/0002-openapi-first-api.md) - Accepted
- [ADR-0003: PostgreSQL production and SQLite local development](adr/0003-database-strategy.md)
- [ADR-0004: Database migrations and environment parity](adr/0004-database-migrations.md)
- [ADR-0005: Role-based access control](adr/0005-role-based-access-control.md)
- [ADR-0006: Journey domain and work package status](adr/0006-journey-work-packages-and-status.md)
- [ADR-0007: Engineering verification standards](adr/0007-engineering-verification-standards.md)
- [ADR-0008: Frontend test strategy](adr/0008-frontend-test-strategy.md)
- [ADR-0009: Local-only Swagger UI](adr/0009-local-only-swagger-ui.md)
- [ADR-0010: Initial OpenAPI and SQLite implementation](adr/0010-openapi-and-sqlite-implementation.md)
- [ADR-0011: Site API and relational data model](adr/0011-site-api-and-relational-data-model.md)
- [ADR-0012: Complete domain table inventory](adr/0012-complete-domain-table-inventory.md)
- [ADR-0013: Local database lifecycle commands](adr/0013-local-database-lifecycle-commands.md)
- [ADR-0014: Existing API content backed by SQLite](adr/0014-api-content-database-migration.md)
- [ADR-0015: User administration experience](adr/0015-user-administration-experience.md)
- [ADR-0016: PostgreSQL production integration](adr/0016-postgresql-production-integration.md)
- [ADR-0017: API hardening and production-readiness gates](adr/0017-api-hardening-and-production-readiness.md)
- [ADR-0018: Production hosting and API topology](adr/0018-production-hosting-and-api-topology.md) - Proposed for project-owner review
- [ADR-0019: Identity and access lifecycle](adr/0019-identity-and-access-lifecycle.md) - Proposed for project-owner review
- [ADR-0020: Data protection and retention](adr/0020-data-protection-and-retention.md) - Proposed for project-owner review
- [ADR-0021: Operations and reliability](adr/0021-operations-and-reliability.md) - Proposed for project-owner review
- [ADR-0022: API lifecycle and compatibility](adr/0022-api-lifecycle-and-compatibility.md) - Proposed for project-owner review
- [ADR-0023: Announcement domain and content management](adr/0023-announcement-domain-and-content-management.md) - Proposed for project-owner review
- [ADR-0024: Legacy JSON data and database source of truth](adr/0024-legacy-json-data-to-database-source-of-truth.md) - Proposed for project-owner review
- [ADR-0025: Structured data and binary storage](adr/0025-structured-data-and-binary-storage.md) - Proposed for project-owner review
- [ADR-0026: PostgreSQL connection setup](adr/0026-postgresql-connection-setup.md) - Accepted for connection setup; adapter and migration parity pending
- [ADR-0027: Leadership Organizational Chart](adr/0027-leadership-orgchart.md) - Proposed for project-owner review
- [ADR-0028: PostgreSQL Compatibility, Test Layers, and CI Gates](adr/0028-database-test-and-ci-strategy.md) - Proposed for project-owner review
- [ADR-0029: SSO-Compatible Leadership RBAC and Guest Navigation](adr/0029-sso-compatible-leadership-rbac.md) - Proposed for project-owner review

## Ownership

- `Journey`: assigned to `danny.c.francisco`.
- `OpenAPI first`: project-wide implementation priority, owned by `danny.c.francisco`.
- `Local Swagger UI`: development-only tooling; never exposed in production.
- `Configuration`: environment-driven and owned by `danny.c.francisco` under `WP-013`.
- `Production readiness`: cross-cutting remediation owned by `danny.c.francisco` under `WP-018`.

See [Work package tracking](work-packages.md) for the current implementation inventory.

See [API and data inventory](api-data-inventory.md) for the complete site review.

See [Navigation flows](navigation-flows.md) for the implemented main flow and planned admin dashboard flow.

## Engineering handbooks

- [FED Handbook](handbooks/fed-handbook.md) - Angular frontend development, SSO-safe UI, unit tests, and Playwright guidance.
- [BED Handbook](handbooks/bed-handbook.md) - Express API, adapters, migrations, PostgreSQL, SSO, and RBAC.
- [QA Handbook](handbooks/qa-handbook.md) - test layers, test planning, release gates, exploratory testing, and defect handling.

Local environment variables are documented in [Local development](runbooks/local-development.md). Copy `.env.example` to `.env` and keep real identity values local.

## Planned documentation

- `openapi/`: versioned API contract and generated artifacts
- `runbooks/`: local setup, migrations, deployment, and rollback procedures
- [PostgreSQL Compose runbook](runbooks/postgresql-compose.md) - production-like local stack operations.
- [Testing and release runbook](runbooks/testing-and-release.md) - verification and release evidence.
- [Incident response runbook](runbooks/incident-response.md) - triage, security, data, recovery, and closure.
- `decisions/`: unresolved architecture questions and accepted follow-up proposals

## Current implementation questions

1. Which identity provider is authoritative for production users and group membership?
2. Which roles and permissions are required for the first release?
3. Is a work package assigned to one user, a team, or both?
4. Which status transitions are allowed, and who may perform each transition?
5. Which existing JSON data must be migrated into the database?
6. Is SQLite only for developer convenience, or must it also support offline/demo deployments?
