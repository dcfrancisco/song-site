# ADR-0029: SSO-Compatible Leadership RBAC and Guest Navigation

- Status: Proposed for project-owner review
- Date: 2026-09-24
- Owner: To be assigned
- Related work packages: `WP-028`, `WP-030`
- Related ADRs: `ADR-0005`, `ADR-0019`, `ADR-0027`

## Context

The application already supports Microsoft Entra SSO through the frontend authentication service. Leadership and organizational-chart maintenance must not replace, bypass, or regress that SSO flow.

The product needs two distinct access experiences:

- Guests should be able to see the permitted site menus and public leadership content.
- Authenticated users should receive only the edit capabilities granted by their roles and permissions.

Leadership records are shared content. Editing them must be controlled by server-side authorization, not by whether an Angular menu item or route is visible.

## Decision

Keep the existing SSO flow as the authentication entry point. Do not introduce a second login mechanism for leadership maintenance. The backend must validate the SSO access token and resolve the authenticated user before allowing protected mutations.

Use permissions as the enforcement unit and roles as permission bundles:

- `leadership:read`: read leadership content when the resource is public or the user is otherwise entitled to it.
- `leadership:manage`: create, update, reorder, or retire leadership records.
- `orgchart:manage`: create, update, reorder, or retire organizational-chart nodes.

The initial role guidance is:

- `guest`: no authenticated edit permissions; may see public menus and public leadership reads.
- `member`: authenticated user with normal product access; no leadership maintenance by default.
- `leadership-editor`: approved content maintainer with `leadership:manage` and `orgchart:manage`.
- `admin`: platform administrator with the leadership permissions only where explicitly assigned by policy; administrator status must not be inferred from client UI state.

Role-to-permission mapping must be sourced from approved identity claims or group mappings defined by the identity authority. Display name, email address alone, frontend state, hidden links, and route guards must never grant edit access.

Guest navigation may expose menu entries for public pages. A visible menu is not an authorization grant. Public GET endpoints may remain accessible without SSO only for content approved as public; all leadership mutations require an authenticated user with the relevant permission.

Leadership mutations must also enforce request validation, audit the actor and change, and return a clear forbidden response when the user is authenticated but lacks the required permission. Unauthenticated mutation requests must be rejected.

## SSO compatibility requirements

- Preserve the existing Microsoft Entra/MSAL login, redirect, logout, and account-display behavior.
- Add authorization claims and permission checks around the existing authentication boundary rather than replacing it.
- Keep Angular guards and menu filtering as user-experience aids only.
- If SSO is unavailable or the token is invalid, fail closed for mutations; do not silently grant guest edit access.
- Support a controlled local/test identity fixture only in non-production test environments.

## Consequences

Guests can discover public site areas without being forced through SSO, while leadership editing is restricted to approved maintainers. The backend must gain token validation, user/role resolution, permission middleware, audit records, and negative authorization tests before leadership maintenance is production-ready.

The leadership editor role is narrower than a platform administrator, reducing the risk of granting unrelated administrative access to content maintainers. The exact Entra groups/claims and approval process remain project-owner decisions.

## Verification

The implementation is complete only when tests demonstrate that:

- an unauthenticated guest can access permitted public navigation/content;
- an unauthenticated guest cannot mutate leadership or org-chart records;
- an authenticated member without the required permission receives `403`;
- an approved leadership editor can perform permitted mutations;
- an administrator follows the approved mapping and does not receive implicit unrestricted access;
- invalid, expired, wrong-audience, or unmapped SSO tokens fail closed;
- existing SSO login, redirect, logout, and authenticated navigation behavior remains intact.
