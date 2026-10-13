# ADR-0035: Development Authentication and Identity Isolation

- Status: Accepted for implementation; WP-035/WP-036 implementation in progress
- Date: 2026-10-13
- Owner: To be assigned
- Related work packages: `WP-035`, `WP-036`, `WP-041`
- Related ADRs: `ADR-0005`, `ADR-0015`, `ADR-0019`, `ADR-0029`, `ADR-0032`

## Context

Local development currently works without Entra only because the landing page's `Skip SSO` action navigates to `/dashboard`. It does not establish an authenticated backend principal. At the same time, `backend/server.js` allows every mutation whenever `NODE_ENV` is not `production`. This makes local mutation convenient but provides no meaningful authorization behavior and creates a fail-open risk if an environment is misclassified.

Developers do not have reliable access to the organization's Entra configuration. Local development, automated tests, and authoring work must therefore remain possible without real Entra credentials while preserving Entra as the production identity provider.

## Decision

Define three user access modes over one backend authorization policy:

1. **Guest Mode** is unauthenticated and read-only. `Skip SSO` enters Guest Mode and never grants an authoring or administrative permission.
2. **Development Mode** uses a server-controlled local identity provider and the same permission checks used by production routes.
3. **Production Mode** uses Microsoft Entra access tokens and the claim-to-user/role mapping governed by `ADR-0019` and `ADR-0032`.

The backend, not the Angular application, selects the identity provider through an explicit `AUTH_MODE`. Development authentication is disabled by default.

### Development identity mechanism

The development provider will expose only named identity fixtures defined in trusted backend configuration or test code. A fixture contains a stable development subject, display name, active state, assigned roles, and scopes. The browser may request a named fixture through a local session-creation flow, but it must never submit roles or permissions.

The backend resolves the selected fixture and issues an opaque, integrity-protected session in an `HttpOnly`, `SameSite=Strict` cookie. State-changing session and authoring requests require same-origin checks and CSRF protection. Production bearer-token validation remains a separate provider that produces the same internal principal shape.

Integration tests may inject a named fixture at the authentication-provider boundary. An arbitrary request header, email address, role name, permission list, hidden UI control, or local-storage value must never create a principal.

### Startup and network safeguards

The process must refuse to start with Development Mode when any of the following is true:

- `NODE_ENV=production`;
- an explicit production/deployed-environment marker is present;
- the configured listener is not loopback, unless a separately named test/container override is enabled for an isolated network;
- session signing material is missing or uses a production secret source; or
- CORS/same-origin configuration would expose the development session endpoint to an unapproved origin.

The normal Development Mode listener is `127.0.0.1` or `::1`. A container-only exception must be explicit, limited to `development` or `test`, and documented as unsafe for public ingress. A deployed environment configured with Development Mode must fail closed at startup; it must not fall back to Guest Mode or unauthenticated writes.

### Session and permission contract

Add a versioned session endpoint, such as `GET /api/v1/session`, that returns the effective mode, identity summary, and permissions needed for presentation. Its response is informational for the frontend; every protected API operation still resolves the server-side principal and enforces the permission itself.

The UI must label a development identity prominently and distinguish it from an Entra account. Developers must be able to exercise an author, publisher, read-only member, inactive user, and no-permission fixture. Switching fixture invalidates the previous local session.

## Consequences

Local authoring and authorization tests can proceed without Entra. Guest behavior remains available, and production authentication is preserved. The backend gains a provider abstraction, session/CSRF responsibilities for local mode, startup guards, and negative tests proving the development provider cannot be enabled publicly.

Development Mode is not a production fallback, emergency login, or substitute for Entra. No development session or fixture is accepted when `AUTH_MODE=entra`.

## Rejected alternatives

- Treating `Skip SSO` as an editor login: it has no trusted identity.
- Sending `X-User`, `X-Role`, or permission headers: clients could grant themselves access.
- Reading roles from Angular environment variables or local storage: these are client-controlled.
- Reusing the shared `X-Admin-Key`: it does not model users, roles, denial, attribution, or session lifecycle.
- Requiring Entra for all local work: it blocks development and automated testing for contributors without tenant access.

## Verification requirements

- Guest requests can read approved public content and receive `401` on protected mutations.
- Read-only and unauthorized development fixtures receive `403` without data changes.
- Authorized development fixtures receive only their configured permissions and are attributed in audit records.
- Client-supplied roles, permissions, subjects, emails, or headers cannot elevate access.
- Development Mode refuses production, deployed, missing-secret, unsafe-bind, and unsafe-origin configurations.
- Session fixation, CSRF, expiry, logout, and fixture switching are tested.
- Production mode rejects development cookies and fixtures and continues to require valid Entra tokens.
- Tests run without real Entra credentials.

## Approval questions

- Which local fixture roles are required initially: `content-author`, `content-publisher`, `leadership-editor`, and/or `admin`?
- May the Compose profile use the isolated-container override, or must Development Mode always bind directly to loopback?
- What local session duration and signing-key generation policy are acceptable?

## Implementation evidence

Implemented in `backend/auth/`, `backend/config.js`, `backend/server.js`, `.env.example`, and the local identity UI in `src/app/auth/session.service.ts` and `src/app/index/`. The implementation includes fixed backend fixtures, signed expiring HttpOnly sessions, CSRF checks, loopback/deployment startup safeguards, and explicit 401/403 mutation enforcement. Production Entra token validation remains a separate WP-041 deliverable and was not changed.
