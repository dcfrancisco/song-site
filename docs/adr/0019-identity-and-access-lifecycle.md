# ADR-0019: Identity and Access Lifecycle

- Status: Proposed for project-owner review
- Date: 2026-09-18
- Owner: To be assigned
- Related work packages: `WP-007`, `WP-016`, `WP-020`

## Context

The frontend uses Microsoft Entra libraries, but the backend does not yet validate bearer tokens or map an external identity to a local user. ADR-0005 defines conceptual permissions without deciding issuer validation, provisioning, role synchronization, deactivation, or emergency recovery.

## Decision

Microsoft Entra is the candidate production identity provider, subject to owner confirmation. The backend MUST be the authority for access decisions:

- Validate issuer, audience, signature, expiry, and required claims on every protected request.
- Identify users by a stable provider subject and issuer, not display name or email alone.
- Provision or reconcile a local user record on first authorized access according to an approved policy.
- Map approved Entra groups or claims to application roles through an explicit configuration and synchronization rule.
- Deny access when a user is inactive, unmapped, expired, or missing required claims.
- Define role-change propagation, deprovisioning, token revocation limitations, admin bootstrap, and break-glass recovery.
- Record administrative role and account-state changes in the audit trail.

Angular guards remain navigation aids only. No frontend state, route, or hidden link may grant access.

## Consequences

The system gains a testable identity boundary and avoids treating client-controlled profile data as authorization. It requires token-validation middleware, local identity tables, synchronization jobs or request-time reconciliation, and security test fixtures.

## Review questions

- Is Entra the authoritative provider for every production user?
- Which groups or claims map to `member`, `lead`, and `admin`?
- Who approves access and who can recover the final administrator?
- What is the deprovisioning SLA and audit retention period?

## 2026-10-13 assessment amendment (status unchanged)

Entra remains the proposed authoritative provider for Production Mode. Local development and automated tests must not require Entra credentials. `ADR-0035` proposes a separate, server-controlled development provider that produces the same internal principal contract while being rejected by production startup safeguards.

Identity records must be keyed by provider, issuer, and subject. Development fixture subjects use an isolated provider namespace and must never reconcile with Entra users by email or display name. Account active state, role assignments, permissions, and author attribution are resolved on the server after authentication.

The implementation should expose one authentication-provider interface with separate Entra and development adapters. This does not authorize the development provider: its startup, session, network, and fixture controls require project-owner approval through `ADR-0035`. The status of this ADR remains proposed.
