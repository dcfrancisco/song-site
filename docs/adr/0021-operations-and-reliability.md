# ADR-0021: Operations and Reliability

- Status: Proposed for project-owner review
- Date: 2026-09-18
- Owner: To be assigned
- Related work packages: `WP-017`, `WP-018`, `WP-022`

## Context

The repository defines local development and PostgreSQL integration plans, but production operations are not yet assigned. There is no agreed service-level target, health model, backup schedule, alerting policy, incident runbook, or recovery evidence.

## Decision

Production readiness MUST include an operational baseline approved by service owners:

- liveness and readiness checks for the API and database dependency;
- structured request, error, migration, and audit logging with sensitive-data redaction;
- metrics for availability, latency, error rate, database health, and migration state;
- alerts with named responders and escalation paths;
- encrypted backups with tested restore procedures;
- documented RTO, RPO, maintenance, migration, rollback, and forward-fix procedures;
- staging validation before production promotion;
- dependency and secret rotation ownership.

The API MUST fail closed for unavailable identity or database dependencies where continuing could corrupt authorization or shared state. Operational endpoints MUST not disclose credentials, tokens, or unrestricted user data.

## Consequences

Production support becomes measurable and auditable rather than dependent on local knowledge. The project must fund monitoring, backups, staging, and restore exercises before declaring PostgreSQL integration complete.

## Review questions

- What availability, RTO, and RPO targets apply?
- Which platform supplies monitoring, backups, and alerting?
- Who is the primary and secondary incident responder?
- How often must restore and disaster-recovery exercises run?
