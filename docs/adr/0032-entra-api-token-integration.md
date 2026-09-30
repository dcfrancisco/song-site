# ADR-0032: Microsoft Entra SSO and API Token Integration

- Status: Proposed for project-owner review
- Date: 2026-09-30
- Owner: To be assigned
- Related work packages: `WP-033`, `WP-020`, `WP-030`, `WP-018`
- Related ADRs: `ADR-0005`, `ADR-0019`, `ADR-0029`, `ADR-0031`

## Context

The frontend already uses Microsoft Entra ID through `@azure/msal-browser` for interactive login, logout, redirect handling, and account display. It currently requests only OpenID Connect identity scopes and does not acquire an access token for the Song Site API. API requests therefore do not carry an Entra bearer token.

The backend does not validate Entra tokens. Production mutation routes currently use a temporary `X-Admin-Key` bridge, while the frontend also exposes a guest `Skip SSO` path. This is not sufficient for identity-backed authorization, leadership maintenance, or user-owned Journey operations.

The proposed change may involve a new Entra tenant, app registration, or API registration. Azure/Entra is already present in the frontend; the migration is primarily an identity configuration and backend trust-boundary change rather than a replacement of the client authentication library.

## Decision

Use Microsoft Entra ID as the production identity provider for both interactive frontend sign-in and protected Song Site API access, subject to project-owner approval of the tenant and app registrations.

The target integration must use:

- a browser SPA app registration for the Angular client;
- a protected API app registration with a documented application ID URI and delegated scope such as `access_as_user`;
- frontend MSAL token acquisition using the API scope, with silent acquisition first and an interactive fallback when consent or reauthentication is required;
- an Angular HTTP integration that attaches the access token only to the approved Song Site API origin;
- backend validation of JWT signature, issuer, audience, expiry, tenant, and required claims using Entra's published signing keys;
- stable identity mapping based on issuer and subject, with approved group or app-role claims mapped to application permissions;
- fail-closed behavior for invalid, expired, wrong-audience, wrong-tenant, unmapped, or missing-permission tokens;
- guest access only for explicitly public reads. Guest navigation must never authorize mutations;
- a controlled non-production test identity or fixture that cannot be enabled in production.

The temporary `X-Admin-Key` mutation bridge must be retired only after bearer-token validation, permission mapping, audit behavior, migration of callers, and negative authorization tests are verified. The API contract and deployment configuration must be updated before production promotion.

## Consequences

The frontend gains an explicit API token lifecycle and must handle consent, expiry, silent renewal failures, logout, and redirect behavior. The backend gains a security-critical token-validation boundary, identity reconciliation, role/permission mapping, audit requirements, and authorization middleware.

Entra app registrations, API scopes, redirect URIs, allowed origins, tenant settings, group/app-role assignments, and environment-specific configuration become release-managed infrastructure. Existing cached browser accounts and tokens may become invalid after a tenant or client migration and must be treated as disposable session state.

Public GET behavior can remain guest-compatible, but protected API operations will require authenticated claims. This decision does not select the exact Azure hosting service; that remains covered by `ADR-0031`.

## Implementation boundary

This ADR is documentation only. No MSAL configuration, HTTP interceptor, backend token middleware, database migration, app registration, secret, Azure resource, or deployment workflow is added by this decision.

## Verification requirements

Implementation is complete only when tests demonstrate:

- successful sign-in, redirect, logout, silent token acquisition, and interactive token fallback;
- API requests receive a token only for the approved API origin;
- valid tokens are accepted for the intended tenant, audience, and scope;
- invalid, expired, wrong-tenant, wrong-audience, malformed, and unmapped tokens are rejected;
- authenticated users without the required permission receive `403`;
- unauthenticated users cannot mutate protected resources;
- guest public reads continue to work;
- user identity reconciliation and role changes are auditable;
- the temporary admin-key bridge is disabled after the replacement path is verified.
