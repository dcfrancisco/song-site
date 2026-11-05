# ADR-0040: Sign-In-Only Portal Access

- Status: Accepted for the current access policy; production authentication integrations remain incomplete
- Date: 2026-10-28
- Owner: To be assigned
- Related work packages: `WP-033`, `WP-041`, `WP-044`
- Related ADRs: `ADR-0019`, `ADR-0032`, `ADR-0035`, `ADR-0038`

## Context

The portal needs one clear sign-in experience without turning a `Skip SSO` action, a frontend flag, a user-entered email address, or a role selector into an authorization mechanism. The current product decision is that `/signin` is the only public portal page; there is no anonymous Home or guest-browsing path.

The bench project also needs local development and automated tests to work without real Entra credentials. This is different from production access for users who do not have organizational SSO.

## Decision

Use `/signin` as the only unauthenticated portal route and offer explicit, fail-closed access paths:

1. **Microsoft Entra SSO** is the intended Production Mode path for users with approved organizational access. The frontend can initiate Microsoft sign-in, but backend Entra token validation, identity mapping, and protected API access are not implemented; this path is not yet qualified end to end.
2. **Email one-time code with self-registration** is the selected non-SSO direction. The email form remains disabled until a delivery service, verification, account activation, and authorization policy are implemented. An email address alone never authenticates or authorizes a user.
3. **Development Mode** is the local-only, server-controlled fixture path defined by ADR-0035. It is available only in explicit local development configuration, uses signed expiring sessions, and is rejected in production or public deployments. An optional development-only email override may label the configured local administrator; it does not prove ownership of that address, create a production account, or grant access outside the local fixture.
4. **No anonymous portal browsing** is provided. `/` redirects to `/signin`; every other portal route and every data API requires a server-authenticated session. `/api/v1/session` is an unauthenticated session-status/bootstrap endpoint and returns no portal data. `/api/v1/dev/session` is available only for loopback Development Mode. Health checks are operational endpoints, not portal pages.

After trusted authentication, the shared shell uses the server-resolved user's identity and sends the user to the role-appropriate `/dashboard` route. The authenticated header has no Sign In button. Its account button displays only the signed-in user's trusted name; **Profile** is not displayed on the button. The dropdown contains **Profile** → `/dashboard` and **Logout** → invalidate the active session and return to `/signin`. Profile is available to all authenticated roles; dashboard data and tools remain role-scoped, with authorized management capabilities for administrators and limited member-scoped content for members. This label/action contract supersedes earlier account-menu wording in ADR-0038. Account controls are navigation/session controls, not authorization controls. Backend principal resolution remains authoritative for every protected API and route.

## Landing and post-login behavior

`/signin` is the only public portal page. The root URL `/` redirects there. All other routes require the backend session; unauthenticated direct navigation redirects to `/signin`. There is no public Home, guest mode, or "continue without SSO" route.

Every authenticated user lands on the same canonical `/dashboard` route. The backend resolves the principal's role, active state, ownership and approved cohort scope, then returns only dashboard data and tool capabilities allowed for that user.

- **Regular member:** sees personal dashboard status, own onboarding/task progress, own blockers and approved shared resources. Member queries are restricted to the member's own identity.
- **POC/lead:** sees their own dashboard plus only the approved team/cohort/member scope assigned to them. They do not receive platform-wide user or administrative data by default.
- **Administrator:** sees authorized operational statistics and management tools, including User Management where the backend grants the required permission. Role and permission administration remains a separate future capability.
- **Developer/test identity:** sees the dashboard behavior granted by its server-side fixture permissions and is visibly labeled as Development Mode. It is not a production user.

The frontend may hide or show navigation items for usability, but this is not an authorization boundary. Direct route access and every data API must enforce the same policy on the backend. A role label alone must never determine data access.

## Consequences

Positive:

- The portal has one clear anonymous entry point and no unauthenticated data-reading path.
- Local development and tests remain independent of organizational tenant access.
- The sign-in page communicates why email sign-in is unavailable instead of presenting a hidden bypass.
- Provider-specific identity records can remain isolated and auditable.

Costs and risks:

- Production access is incomplete until the backend Entra verifier and identity mapping are implemented and qualified.
- Email sign-in cannot be enabled until delivery, verification, activation, and account authorization are implemented.
- Account linking must use approved stable provider identifiers, never email alone.
- The sign-in page and provider failures need clear loading, retry, unavailable-provider, and support states.

## Security constraints

- A provider may authenticate a user, but backend authorization still determines access.
- Development fixtures never enter a production identity store.
- The browser cannot choose a role, permission, identity, or data scope.
- An email address configured for a local development fixture is display/configuration data only and must never be committed.
- Sign out must invalidate the active local or provider session and prevent reuse of the previous authenticated session.
- Session-status and local bootstrap endpoints must not expose protected portal data.

## Verification requirements

- `/signin` is the only unauthenticated portal route; `/` redirects to `/signin`.
- Unauthenticated direct navigation to each protected route redirects to `/signin`.
- Unauthenticated requests to portal data APIs receive `401`; inactive or unauthorized principals receive `403`.
- `/api/v1/session` remains available for status/local bootstrap but does not expose protected data.
- Entra users can access protected APIs only after backend token verification and principal resolution are implemented.
- Email sign-in remains disabled until code delivery and verification are configured; no email-only session is created.
- Development Mode works on loopback without Entra and fails closed when deployed publicly or with Production Mode.
- The authenticated header has no Sign In button; its button displays only the trusted user's name. The dropdown contains Profile for all authenticated roles and Logout; Profile opens the role-scoped `/dashboard`, while Logout invalidates the session and returns to `/signin`.
- Unmapped, inactive, expired, malformed, and wrong-provider identities are rejected.
- Browser and backend negative tests cover provider availability, logout, direct-route access, and API authorization.

## Open decisions requiring approval

- Which Entra tenant, claims mapping, provisioning, and administrator recovery rules are approved for production?
- Which email-delivery service and verification/retention policy will support the selected one-time-code flow?
- What access or activation policy applies to self-registered email users? Self-registration must not imply any role or protected data access.
