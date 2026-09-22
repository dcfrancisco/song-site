# ADR-0022: API Lifecycle and Compatibility

- Status: Proposed for project-owner review
- Date: 2026-09-18
- Owner: To be assigned
- Related work packages: `WP-005`, `WP-011`, `WP-018`, `WP-023`

## Context

The repository currently exposes compatibility routes under `/api/*` while the target architecture calls for versioned `/api/v1` APIs. ADR-0002 requires stable contracts, but it does not define version support, deprecation, error format, pagination, or compatibility ownership.

## Decision

Adopt an explicit API lifecycle policy:

- New production capabilities MUST be introduced under `/api/v1` and documented in OpenAPI before implementation.
- Existing `/api/*` routes remain compatibility endpoints only while frontend consumers migrate.
- Every operation MUST define authentication, authorization, request validation, response schemas, stable error envelopes, and operation identifiers.
- List endpoints MUST define pagination, filtering, sorting, limits, and maximum response sizes before they are exposed to production users.
- Breaking changes require a new API version or an approved migration plan with a published deprecation date.
- Contract compatibility tests MUST run in CI against representative success, validation, authorization, and not-found cases.
- One owner MUST be accountable for route inventory, deprecation decisions, and client migration.

## Consequences

Clients get predictable behavior and a controlled migration path, but compatibility routes require maintenance until retired. API design, security policy, and test evidence become part of the definition of done for each endpoint.

## Review questions

- How long will compatibility `/api/*` routes be supported?
- What is the standard error envelope and correlation identifier?
- Which endpoints require pagination or rate limits in the first release?
- Who approves breaking changes and announces deprecations?
