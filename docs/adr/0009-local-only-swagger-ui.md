# ADR-0009: Local-Only Swagger UI

- Status: Accepted
- Date: 2026-09-18

## Context

The project now has an OpenAPI contract, but developers need a convenient local way to browse and try the contract. Exposing interactive API documentation in production can disclose endpoint details and create an unnecessary attack surface.

## Decision

Serve Swagger UI only in local development, using the versioned contract at `docs/openapi/song-site.yaml`.

- The local development server may expose `/api-docs`.
- Swagger UI must require explicit development mode, such as `NODE_ENV=development`.
- The application must not mount Swagger UI when `NODE_ENV=production`.
- Production deployments must not depend on Swagger UI or contract rendering at runtime.
- OpenAPI validation remains a build or CI concern, separate from serving the local UI.

## Consequences

Developers get interactive contract documentation without publishing it with the deployed application. Local setup needs a documented development command, and deployment checks must verify that production does not expose `/api-docs`.
