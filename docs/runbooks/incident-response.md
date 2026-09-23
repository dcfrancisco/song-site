# Incident Response Runbook

Use this runbook for production or production-like failures affecting users, identity, data, or availability.

## 1. Stabilize

1. Record the time, environment, deployment/build, and reporter.
2. Identify whether the issue is availability, authentication, authorization, data integrity, or presentation.
3. Stop risky writes or promotion if data integrity or authorization is uncertain.
4. Do not restart or reset databases until logs, status, and recovery options are captured.

## 2. Triage commands

For Compose:

```bash
docker compose ps
docker compose logs --since=15m backend
docker compose logs --since=15m frontend
docker compose logs --since=15m postgres
```

Check:

- backend process and database readiness;
- PostgreSQL connection errors, migration errors, and constraint violations;
- frontend proxy responses and browser console errors;
- recent identity configuration or redirect URI changes; and
- whether the issue affects guests, all users, or only privileged mutations.

## 3. Security incidents

For suspected SSO failure or authorization bypass:

- disable or restrict the affected mutation path if safe;
- preserve relevant logs without tokens or personal data;
- verify `401` versus `403` behavior;
- confirm frontend hiding did not substitute for backend authorization;
- rotate compromised credentials through the deployment secret manager; and
- notify the system owner/security contact according to organizational policy.

Never paste access tokens, cookies, passwords, or full connection strings into tickets or chat.

## 4. Data incidents

Do not run `docker compose down -v`, `db:reset`, or ad hoc destructive SQL during an incident. First capture the affected record IDs, timestamps, migration version, and database backup/recovery status. Prefer a reviewed forward-fix or restore procedure.

## 5. Recovery and closure

After service recovery:

- verify health, API reads, SSO login/logout, and a representative authorized mutation;
- confirm no unauthorized data became visible;
- record root cause, contributing factors, timeline, impact, and corrective actions;
- add a regression test or monitoring check; and
- update the relevant handbook, ADR, or runbook.

