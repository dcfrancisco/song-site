# Testing and Release Verification Runbook

Use this runbook before merging or promoting a change.

## Fast feedback

From the repository root:

```bash
npm run test:ci
npm run build:ci
```

From `backend/`:

```bash
npm test
node --check server.js
node --check postgres-database.js
```

## Full local verification

```bash
npm run verify
docker compose config --quiet
docker compose build
git diff --check
```

If database or API code changed, start Compose and run the PostgreSQL checks in [PostgreSQL Compose](postgresql-compose.md).

## Playwright

Run the repository's configured Playwright tests in an environment with the target application available. Use the approved test identity/fixture only; do not put credentials in `.env.example`, test source, or CI logs. On failures, retain the trace and screenshot, then remove sensitive artifacts before sharing.

## Review evidence

The pull request should state:

- commands run and pass/fail results;
- changed test files and coverage intent;
- whether SQLite and PostgreSQL were both exercised;
- SSO/RBAC scenarios checked;
- migration or seed impact;
- known warnings or deferred coverage; and
- rollback or forward-fix steps.

## Release decision

Do not promote when a critical/high security, SSO, data integrity, or migration issue is open. A warning may be accepted only when it is understood, non-blocking, and recorded with an owner.

