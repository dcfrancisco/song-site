# QA Handbook

Quality engineering guide for Song Site. It covers exploratory testing, automated tests, release confidence, and defect communication for associate through advanced practitioners.

## 1. Quality model

QA validates behavior across four dimensions:

1. **Functional** — the feature does what the contract says.
2. **Security** — guests, authenticated users, and privileged users receive only the access intended for them.
3. **Compatibility** — SQLite development and PostgreSQL production-like environments do not diverge unexpectedly.
4. **Usability** — navigation, errors, keyboard behavior, responsive layout, and SSO states are understandable.

Testing is continuous. QA participates during refinement, implementation, pull request review, release, and incident follow-up.

## 2. Test layers

| Layer | Purpose | Typical command/location |
| --- | --- | --- |
| Frontend unit | Components, services, state, and mapping | `npm run test:ci`; colocated `*.spec.ts` |
| Backend unit | Adapter and API logic | `cd backend && npm test` |
| PostgreSQL integration | Schema, queries, adapter behavior, and API against PostgreSQL | Compose stack and API smoke checks |
| Playwright | Browser journeys, routing, guest/auth states, and critical UI behavior | `playwright-*.spec.ts` |
| Build verification | Production compilation and packaging | `npm run build:ci`, `docker compose build` |
| Exploratory | Real-world behavior, accessibility, and edge cases | Test charter/checklist |

## 3. Test planning template

For every feature, record:

- user/persona: guest, valid user, editor, or administrator;
- preconditions and required data;
- happy path;
- validation and empty states;
- network/API failure;
- unauthorized (`401`) and forbidden (`403`) behavior;
- SSO initialization, redirect, and logout impact;
- browser/responsive/accessibility checks;
- data cleanup requirements; and
- evidence: test output, screenshots, logs, or Playwright trace.

## 4. Leadership/org chart checklist

- Guest can see the intended leadership menu/view.
- Unauthenticated users cannot create, update, or delete nodes.
- Authenticated read-only users can view but do not receive edit capability.
- Authorized users can create a root or child node with valid data.
- Invalid names, roles, parent IDs, and sort orders are rejected clearly.
- Circular or missing parent relationships cannot be created.
- Update and delete reflect in the next read.
- Existing SSO login/logout behavior remains intact.
- Empty, loading, error, and slow-network states are usable.
- The visual result represents the org chart only and does not reproduce mock branding.

## 5. Playwright guidance

Keep browser tests focused on user-observable outcomes:

- navigate to a stable route;
- wait for the application readiness state;
- use accessible roles/labels instead of brittle CSS selectors;
- avoid fixed sleeps;
- isolate test data or clean up mutations;
- never put real credentials or tokens in the repository;
- use a safe authenticated fixture only in an approved test environment; and
- capture a trace/screenshot on failure.

If SSO cannot be exercised in CI, explicitly test the unauthenticated/skip path and record the missing authenticated coverage as a release risk.

## 6. Defect severity

| Severity | Example | Expected response |
| --- | --- | --- |
| Critical | Data loss, auth bypass, production outage | Stop release; page owner/on-call immediately. |
| High | Core journey unavailable, broken SSO, incorrect protected mutation | Fix or formally waive before release. |
| Medium | Feature degraded with workaround | Prioritize for the release or document acceptance. |
| Low | Cosmetic or minor copy/layout issue | Track for normal backlog. |

Every defect should include environment, build/commit, exact steps, expected/actual result, affected persona, evidence, and whether data cleanup is needed.

## 7. Release gate

Before release, QA checks:

- focused tests for changed areas;
- complete frontend unit suite;
- backend unit suite;
- production frontend build;
- Docker Compose build and smoke test when backend/database behavior changed;
- OpenAPI and migration review;
- SSO and RBAC regression checklist;
- no secrets or local database files in the change; and
- documented known risks and rollback/forward-fix plan.

## 8. Test data and safety

Use synthetic users and records. Do not copy production personal data into local databases or screenshots. Clean up created org-chart nodes after tests unless the environment is disposable. Redact tokens, cookies, connection strings, and personal data from evidence.

