# ADR-0001: Architecture Baseline

- Status: Accepted
- Date: 2026-09-18

## Context

Song Site currently consists of an Angular frontend, a small Express backend, and JSON files used as mutable application storage. The frontend already contains Journey and My Journey experiences, while the backend exposes task-oriented endpoints without a formal API contract, persistence layer, or authorization model.

## Decision

The system will evolve as a modular web application with:

- Angular as the frontend.
- A versioned HTTP API as the boundary between frontend and backend.
- Express retained initially as the backend runtime while the API contract and domain boundaries are established.
- A relational database replacing mutable JSON files for application state.
- Authentication and authorization enforced by the backend, not only by Angular route guards.
- Journey, work packages, tasks, users, roles, permissions, and status transitions treated as explicit domain concepts.

Implementation will be incremental. Existing screens remain usable while backend contracts and persistence are introduced behind them.

## Consequences

This avoids coupling application state to build artifacts or local JSON files, but requires migrations, API validation, authorization tests, and a deliberate data migration from the current backend JSON files.
