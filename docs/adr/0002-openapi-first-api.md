# ADR-0002: OpenAPI-First API Design

- Status: Accepted
- Date: 2026-09-18

## Context

The current backend routes are implemented directly in `backend/server.js`. Request and response shapes, error formats, authorization requirements, and status transitions are implicit. This makes frontend and backend changes difficult to coordinate.

## Decision

OpenAPI is the source of truth for the HTTP API. The contract will be written before implementing each new endpoint and will define:

- paths, operations, parameters, and request bodies;
- response schemas and stable error responses;
- authentication and required permissions;
- pagination, filtering, and sorting rules;
- status transition behavior;
- examples for the main Journey workflows.

The contract should live under `docs/openapi/` and be validated in CI. Runtime request validation should be generated from or kept consistent with the contract rather than relying on ad hoc parsing in route handlers.

## Consequences

API changes become reviewable and easier to consume, but endpoint work now includes contract updates and validation. The current JSON endpoints should be treated as a compatibility surface until their replacements are migrated.
