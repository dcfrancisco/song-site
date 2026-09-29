# ADR-0030: Journey API Source of Truth and State Transitions

- Status: Proposed for project-owner review
- Date: 2026-09-29
- Owner: `danny.c.francisco`
- Related work packages: `WP-002`, `WP-003`, `WP-005`, `WP-018`, `WP-023`, `WP-031`
- Supersedes: none; clarifies `ADR-0024` for Journey runtime behavior

## Context

The `/my-journey` experience currently reads its cards from `/api/tasks` and updates task status through `/api/tasks/{id}/status`. Those routes persist through the configured SQLite or PostgreSQL adapter. A separate legacy `/api/journey/items` route and the older `/journey` components use the `journey_items` table and browser `localStorage` instead. These paths can return different Journey state for the same task.

The Journey page also coordinates task and training-task state in the browser. Mutation failures are not consistently surfaced, and the current temporary write gate does not provide user ownership or user-level authorization.

## Decision

The `tasks` and `training_tasks` API resources are the canonical runtime source for the `/my-journey` and `/training-tracker` experiences. The frontend MUST read and mutate shared Journey state through the API; browser storage MAY retain presentation-only state but MUST NOT be authoritative for task status, dates, progress, or completion.

The implementation MUST:

- keep `/api/tasks` and `/api/training-tasks` response shapes aligned across SQLite and PostgreSQL;
- use the status-transition endpoints for start, reopen, and complete operations;
- return the persisted resource from every successful mutation and update the UI only after that response succeeds;
- expose mutation failures and prevent duplicate submissions while a request is pending;
- define and test the parent training-task transition when all training tasks are complete;
- migrate or retire consumers of `/api/journey/items` and the legacy `/journey` storage path before removing the compatibility route;
- update the OpenAPI contract before changing routes, payloads, response shapes, or deprecation behavior;
- add success, malformed-request, not-found, unauthorized, and persistence/read-after-write coverage;
- replace the temporary shared write gate with authenticated, ownership-aware authorization before production release.

The `journey_items` table and `/api/journey/items` endpoint are compatibility inventory, not a second source of truth. Their retirement requires a consumer search, migration evidence, and an explicit deprecation/removal note.

## Pending rollout safeguards

The following consequences are accepted as implementation risks but are not yet authorized for production rollout:

- Removing `/api/journey/items` MAY break external clients, older frontend bundles, bookmarks, or scripts that still depend on its response shape.
- Ownership authorization MAY change visible Journey state for existing users unless current shared records are migrated or assigned first.

Before either change is enabled, implementation MUST:

1. inventory repository and deployment consumers;
2. monitor or otherwise verify compatibility-route usage;
3. publish a deprecation window and migration path;
4. migrate existing Journey records into the selected ownership scope;
5. add authenticated, unauthorized, cross-scope, read-after-write, and mutation-transition tests;
6. use a staged response policy such as deprecation notice, then `410 Gone`, then route removal.

Until those gates are complete, the compatibility route remains available but deprecated, and ownership authorization remains pending.

## Consequences

Journey state has one runtime authority and refreshes consistently across navigation and browser sessions. The frontend becomes simpler because it no longer reconciles API state with `localStorage`. Existing compatibility code requires a controlled migration, and production readiness remains blocked on identity, ownership, authorization, and negative-test coverage.

The decision does not remove the legacy route immediately. It establishes the target behavior while `WP-031` performs the migration and verification work.

## Review questions

- Should the parent `Complete all Training trackers` task complete automatically when every training task is complete?
- Which identity and team scope own a Journey record?
- What deprecation period is required for `/api/journey/items` and `/journey`?
- What telemetry or access-log evidence is sufficient to approve compatibility-route retirement?
- How will existing shared Journey records be assigned before ownership enforcement?