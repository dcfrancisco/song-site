# Team Agent Contract

This contract applies to Claude, GitHub Copilot, and any other coding agent working in Song Site. It is the shared team standard; tool-specific instruction files should point here instead of redefining conflicting rules.

## Authority and language

Use the RFC 2119 meanings of **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY**.

- User requests and repository instructions take precedence over agent preferences.
- Preserve unrelated user changes in a dirty worktree.
- Never commit, reset, rebase, or create branches unless explicitly requested.
- Do not expose secrets from `.env`, logs, tokens, identity claims, or local configuration.
- Do not claim a feature is implemented when only an ADR, UI mock, candidate schema, or JSON fixture exists.

## Repository architecture

- Frontend: Angular 21 standalone components with lazy-loaded routes.
- Backend: Express 5 under `backend/`.
- API contract: OpenAPI 3.0.3 at `docs/openapi/song-site.yaml`.
- Local database: SQLite through Node `node:sqlite`.
- Production database target: PostgreSQL.
- Local Swagger UI: development-only, controlled by `NODE_ENV=development` and `SWAGGER_UI=true`.
- Frontend API configuration: `VITE_API_BASE_URL`; same-origin fallback is `/api`.
- The backend under `backend/` is the single API runtime. Do not recreate the removed port-5000 server.

## Implementation standards

### Secure and maintainable code

All AI-assisted code MUST follow applicable OWASP secure-coding guidance and SonarQube quality rules at all times. These are baseline requirements for new code, edits, tests, scripts, infrastructure, and configuration—not optional cleanup items.

- Validate and constrain all untrusted input at the server boundary.
- Use parameterized database access; never construct SQL from untrusted input.
- Protect authentication, authorization, session, secrets, logging, error, and cryptographic behavior according to OWASP guidance.
- Do not introduce hard-coded credentials, insecure defaults, sensitive-data leakage, unsafe deserialization, injection paths, or client-only security controls.
- Prefer clear, small, testable code and remove dead code, duplicated logic, unreachable branches, and avoidable complexity.
- Treat SonarQube findings as defects to fix or explicitly justify; do not suppress a rule without a narrowly scoped reason and documented review.
- When a rule conflicts with an existing implementation, preserve behavior only when necessary and record the deviation plus a follow-up remediation item.

1. Start from the nearest owning route, service, repository, schema, or test.
2. State a falsifiable hypothesis and a focused validation before editing.
3. Prefer the smallest change that preserves existing public routes and response shapes.
4. New APIs MUST be OpenAPI-first: update the contract before or with implementation.
5. Database changes MUST use versioned migrations and an explicit seed strategy. Candidate tables in documentation are not implemented tables.
6. Authorization MUST be enforced server-side. Angular guards are navigation aids, not security boundaries.
7. User-owned data MUST have an explicit ownership or team-scope rule.
8. Sensitive operations such as role changes, account-state changes, and status transitions SHOULD be auditable.
9. Use structured parsing and existing project helpers instead of ad hoc string manipulation.
10. Keep comments rare and explain only non-obvious decisions.
11. Do not call an endpoint production-ready until authentication, authorization, validation, OpenAPI coverage, and negative tests exist for its mutation behavior.
12. Shared user or Journey state MUST be persisted through the API; browser storage MAY cache presentation state but MUST NOT be the authoritative store.

## Validation requirements

After a substantive edit, the next action MUST be the narrowest available check for that slice.

- Frontend: `npm.cmd run test:ci`, `npm.cmd run build:ci`, and focused tests where available.
- Backend syntax: `node --check <file>`.
- Backend tests: run from `backend/` with `npm.cmd test`.
- Database changes: exercise migration, seed, check, and reset with a disposable `DATABASE_PATH`.
- OpenAPI changes: parse `docs/openapi/song-site.yaml` and smoke-test affected endpoints.
- Security-sensitive API changes: test unauthenticated, unauthorized, malformed, and cross-scope requests.
- Documentation-only changes: run `git diff --check`.

If a command cannot run because the environment is missing a dependency or has a shell issue, report that precisely and use the nearest available validation.

## Documentation and delivery

- Architecture decisions belong in `docs/adr/` and must include status, date, context, decision, and consequences.
- Implementation tracking belongs in `docs/work-packages.md` with owner, status, evidence, and ADR links.
- Keep ADR status separate from implementation status.
- Update OpenAPI, runbooks, inventories, or README guidance when behavior changes.
- Final responses SHOULD summarize changed files, validation performed, and known gaps in under 70 lines.
