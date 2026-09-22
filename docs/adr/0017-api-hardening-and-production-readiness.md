# ADR-0017: API Hardening and Production-Readiness Gates

- Status: Accepted as remediation plan
- Date: 2026-09-18
- Owner: `danny.c.francisco`
- Work package: `WP-018`

## Context

The repository now has a functional local API and SQLite database, but an architecture audit identified gaps that prevent production readiness: unauthenticated mutation routes, incomplete OpenAPI coverage, classic Journey state split between SQLite and browser storage, lifecycle commands coupled to module loading, zero backend tests, and a static deployment with no hosted API.

## Decision

Treat the local API as a compatibility implementation and impose the following gates before production promotion.

### 1. Security gate

All mutation routes MUST validate the authenticated identity and enforce server-side permissions. Initial policy follows ADR-0005: members manage permitted own data, leads manage permitted team scope, and administrators manage users and configuration. CORS, route visibility, or Angular guards MUST NOT be treated as authorization.

Mutation inputs MUST be schema-validated, controlled status transitions MUST reject invalid actions, and sensitive changes MUST produce audit records. Negative tests are required for unauthenticated, unauthorized, malformed, and cross-scope requests.

### 2. Source-of-truth gate

Shared Journey state MUST have one authoritative database path. The frontend MAY cache presentation state locally, but status, dates, and progress changes MUST call the API and handle failure explicitly. A localStorage fallback MUST NOT silently overwrite newer server state.

### 3. Contract gate

Every implemented public route MUST have an OpenAPI path, request schema, response schema, error responses, and operation identifier. OpenAPI parsing and route smoke tests are release checks. Compatibility `/api/*` routes remain transitional; new production APIs use `/api/v1`.

### 4. Database gate

Migration, seed, check, and reset are separate operations. Loading the repository MUST NOT be the only way migrations or seeds execute. Migrations MUST be version-tracked, foreign-key enforcement MUST be explicit in SQLite, and reset MUST resolve the same configured database path as other commands. PostgreSQL parity remains governed by ADR-0016.

### 5. Verification and deployment gate

Backend tests MUST cover repository behavior, route contracts, migrations, and authorization. The frontend MUST pass its production build and focused tests. The static GitHub Pages deployment MUST have an externally reachable API configured through `VITE_API_BASE_URL`, with a smoke test against that environment. A successful static asset upload alone is not a successful full-stack deployment.

## Consequences

The current local implementation remains useful for development, but its status is explicitly transitional. Work cannot be marked production-ready merely because routes return data or migrations create tables. `WP-018` coordinates the remediation, while `WP-005`, `WP-006`, `WP-007`, `WP-009`, `WP-013`, and `WP-017` retain ownership of their specific implementation areas.

## Completion criteria

- Protected mutation routes and negative authorization tests exist.
- Journey updates persist through the API and survive a new browser session.
- OpenAPI covers every implemented route and error shape.
- Database lifecycle commands work against a disposable configured path and record migration state.
- Backend tests are non-empty and run in CI.
- Frontend build includes a verified API URL and full-stack smoke test.
- ADR, work-package, runbook, and deployment status all agree.