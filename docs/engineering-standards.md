# Engineering Standards

These standards apply to frontend, backend, API, database, and deployment changes.

## Required before merge

- The change has a linked work package and, when architectural, an ADR.
- TypeScript remains strict and new compiler errors are not introduced.
- `npm run verify` passes locally or the pull request records the exact blocker.
- New frontend behavior has focused unit coverage.
- New API behavior has OpenAPI coverage, request/response validation, and negative authorization tests when protected.
- Database changes include a versioned migration and are tested against PostgreSQL before release.
- Generated output, dependencies, local databases, test results, secrets, and OS metadata are not committed.

## Verification layers

1. **Unit tests:** components, services, status transitions, and permission policy.
2. **API contract tests:** OpenAPI schemas, success responses, validation failures, and authorization failures.
3. **Integration tests:** database migrations and repository behavior against PostgreSQL; SQLite is used for fast local feedback.
4. **Build verification:** production Angular build with the same base path used by deployment.
5. **End-to-end tests:** critical Journey flows against a controlled environment, never against mutable production data by default.

End-to-end tests are intentionally slower than unit tests. They run selectively on pull requests and comprehensively before release; speed must not be achieved by removing coverage from critical user workflows.

## Status reporting

Work is not considered complete because code compiles. A work package is complete only when implementation, tests, documentation, security checks, and deployment or migration notes are present.

Known existing test gaps are tracked in [work package tracking](work-packages.md). The current repository has frontend specs, but backend/API and RBAC tests still need to be added.
