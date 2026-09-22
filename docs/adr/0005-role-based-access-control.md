# ADR-0005: Role-Based Access Control

- Status: Proposed
- Date: 2026-09-18

## Context

The application has authenticated-user-related code but no documented authorization policy. UI visibility alone cannot protect task updates or administrative operations. Journey workflows will eventually need different capabilities for participants, leads, and administrators.

## Decision

Implement RBAC in the backend using permissions as the enforcement unit and roles as permission bundles.

Initial conceptual permissions:

- `journey:read`
- `journey:manage-own`
- `journey:manage-team`
- `work-package:read`
- `work-package:manage`
- `status:update-own`
- `status:update-team`
- `user:manage`

Initial roles should be confirmed with stakeholders, but can begin with `member`, `lead`, and `admin`. Authorization must be checked server-side on every protected operation. Angular guards may improve navigation but are not security boundaries.

Resource ownership and team scope must be evaluated after the role check. A role alone must not grant access to every user’s Journey data unless that is explicitly intended.

## Consequences

Permissions make policy testable and adaptable, but require a user/role/permission model, authenticated identity claims, audit logging for sensitive actions, and negative authorization tests.
