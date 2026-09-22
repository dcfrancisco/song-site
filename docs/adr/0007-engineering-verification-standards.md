# ADR-0007: Engineering Verification Standards

- Status: Accepted
- Date: 2026-09-18

## Context

The project has many frontend specs but no consistent verification command, no backend test suite, and no API contract tests. Existing generated files and a malformed spec include also make repository state harder to trust.

## Decision

Use `npm run verify` as the minimum frontend verification gate. It runs the non-watch unit tests and a production build. New work must add focused tests at the layer where behavior is implemented.

OpenAPI, API validation, database migration, RBAC, and critical Journey end-to-end tests are required as those work packages are implemented. A failing or unavailable check must be reported with its command and cause; it must not be silently skipped.

The detailed standards are maintained in [engineering-standards.md](../engineering-standards.md).

## Consequences

The project gets a repeatable baseline immediately, while backend and security verification are added alongside their implementation rather than being deferred indefinitely.
