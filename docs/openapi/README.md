# OpenAPI Contract

The API contract will be maintained in this directory before new backend endpoints are implemented.

Planned files:

- `song-site.yaml`: versioned OpenAPI document.
- `examples/`: request and response examples used by contract tests.

The first contract should cover authentication context, Journey, work packages, tasks, status transitions, and the current compatibility endpoints. Every protected operation must declare its required permission in the contract.

Swagger UI is development-only. It must be available locally for contract review, but must not be mounted when `NODE_ENV=production`.
