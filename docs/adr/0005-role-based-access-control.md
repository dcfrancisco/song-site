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

## 2026-10-13 assessment amendment (status unchanged)

The original proposal does not cover managed-content authoring or the distinction between authentication providers. Add the following proposed permission families for stakeholder review:

- `content:{pageKey}:edit` and `content:{pageKey}:publish` for page-scoped authoring;
- `leadership:edit` and `leadership:publish` for the current grouped leadership domain; and
- `content:history:read` and `content:restore` where version recovery is not implied by edit permission.

Guest, Development, and Production modes must all produce the same backend authorization decision shape. Guest Mode has no mutation permissions. Development Mode resolves only server-owned fixtures under `ADR-0035`. Production Mode resolves Entra identities under `ADR-0019` and `ADR-0032`. A frontend role, route, environment variable, `Skip SSO`, request header, or hidden control is never an authorization source.

Editing and publishing are separate enforcement units even if an approved initial role contains both. Product-owner approval is required for role bundles, page scope, self-publishing, team scope, and administrative override. This amendment clarifies the proposal and does not mark RBAC implemented or accepted.
