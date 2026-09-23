# BED Handbook

Backend engineering guide for Song Site. BED means backend engineering and development.

## 1. Backend responsibilities

The Express API in `backend/` owns:

- API routing and response contracts;
- input validation and error semantics;
- authentication context and authorization enforcement;
- database access through the selected adapter;
- migration-backed schema changes;
- audit-friendly mutation behavior; and
- integration boundaries used by the frontend and operational tooling.

The backend must never trust frontend visibility, client-provided roles, or a local-only permission check.

## 2. Backend map

| Area | Location | Guidance |
| --- | --- | --- |
| HTTP server | `backend/server.js` | Keep transport, validation, and authorization explicit. |
| SQLite adapter | `backend/database.js` | Local compatibility path; migration-backed. |
| PostgreSQL adapter | `backend/postgres-database.js` | Compose/production-like path. Keep behavior aligned with SQLite. |
| PostgreSQL connection | `backend/postgres.js` | Uses `DATABASE_URL` or PG environment variables. |
| SQLite migrations | `backend/migrations/` | Numbered and applied in order. |
| PostgreSQL migrations/init | `backend/migrations-postgres/`, `docker/postgres/init/` | Keep schema and seed behavior explicit. |
| Tests | `backend/*.test.js` | Use Node's built-in test runner. |
| Contract | `docs/openapi/song-site.yaml` | API-first source for endpoint behavior. |

## 3. Request-to-database workflow

1. Define or update the OpenAPI request, response, status codes, and error shape.
2. Confirm the data model and migration strategy for both supported adapters.
3. Add a repository/adapter method with equivalent behavior in SQLite and PostgreSQL.
4. Add route-level validation and authorization before the mutation reaches the adapter.
5. Add unit tests for the adapter/service boundary and endpoint behavior.
6. Run SQLite tests and PostgreSQL Compose integration checks.
7. Verify SSO request context is preserved and no endpoint relies on a client-supplied identity.

## 4. Database rules

Production targets PostgreSQL 14 or higher with `pgvector`. Local development may use SQLite for speed, but SQLite is not a compatibility substitute for PostgreSQL.

- Select the adapter with `DB_DRIVER`.
- Use `DATABASE_URL` for PostgreSQL; never commit credentials.
- Every schema change is a versioned migration or an intentional Compose initialization change.
- Keep column names, nullability, ordering, and validation semantics aligned across adapters.
- Use parameterized queries only.
- Treat `db:reset` and `docker compose down -v` as destructive local operations.
- Verify the `vector` extension in PostgreSQL environments that require embeddings.
- Do not silently fall back from PostgreSQL to SQLite when `DB_DRIVER=postgres`.

## 5. Leadership and org chart API

Leadership reads are available through the leadership API. Org-chart mutations use the existing leadership storage boundary and require the configured administrative/content permission.

For each mutation:

- validate name, role, parent relationship, and sort order;
- reject malformed or circular parent relationships;
- enforce authorization on the server;
- return a stable status code and response shape;
- preserve SSO identity context for audit and future role evaluation; and
- test both authorized and unauthorized paths.

The temporary Compose content key is local development tooling only. It is not an SSO implementation and must not be used as the production authorization model.

## 6. SSO and RBAC compatibility

SSO remains the identity mechanism. RBAC is an authorization layer over the authenticated identity.

- Do not remove MSAL-compatible identity fields or redirect behavior.
- Do not accept a role or permission from the browser as authoritative.
- Resolve permissions from trusted server configuration, identity claims, or a server-side role store.
- Guests can access permitted read/menu surfaces but cannot mutate protected content.
- A valid user may be read-only or may have leadership content edit permission.
- Return `401` for missing/invalid authentication and `403` for authenticated users without permission.
- Avoid leaking whether protected records exist through unauthorized error details.

## 7. Backend tests

At minimum, new backend code gets tests for:

- valid success path;
- invalid input;
- not-found behavior;
- unauthorized and forbidden behavior;
- adapter parity where the feature uses both databases; and
- transaction/error behavior for writes.

Commands:

```bash
cd backend
npm test
DB_DRIVER=postgres DATABASE_URL=postgresql://... npm run db:postgres:check
```

Use the Compose runbook for full PostgreSQL-backed API verification.

## 8. Operational and security standards

- Keep secrets in environment variables or a secret manager.
- Do not log passwords, bearer tokens, cookies, or raw identity tokens.
- Use bounded request payloads and explicit validation.
- Make health and readiness behavior distinguish process health from database readiness.
- Keep Swagger UI development-only.
- Include migration and rollback/forward-fix notes in pull requests.
- Prefer additive, backward-compatible API changes; document breaking changes in an ADR.

## 9. Definition of done

- OpenAPI, implementation, adapters, and tests agree.
- SQLite and PostgreSQL behavior is intentionally aligned or the difference is documented.
- Authentication and authorization are enforced server-side.
- Migration/init scripts are repeatable and reviewed.
- Unit and integration checks pass.
- Logs and errors are safe for production.
- Runbook and rollback notes exist for operationally meaningful changes.

