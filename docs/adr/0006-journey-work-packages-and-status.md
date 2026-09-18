# ADR-0006: Journey, Work Packages, and Status

- Status: Accepted for domain direction; implementation in progress
- Date: 2026-09-18

## Context

Journey is already represented in the frontend through `/journey`, `/my-journey`, Journey task screens, task models, and status values such as `Not Started`, `Pending`, `In Progress`, and `Completed`. The backend currently exposes generic task and training-task JSON resources, but does not distinguish a Journey, a work package, or an auditable status transition.

## Decision

Treat Journey as the user-facing domain area and model its work as explicit records:

- `journeys`: a user's or team's progression context;
- `work_packages`: a meaningful unit of Journey work;
- `tasks`: actionable items belonging to a work package;
- `status_history`: immutable records of status changes.

The initial status vocabulary is `not_started`, `pending`, `in_progress`, `blocked`, and `completed`. Status transitions must be defined as an allowed state machine rather than accepting arbitrary strings from clients. Every transition records the actor, timestamp, previous status, new status, and optional reason.

The existing `tasks.json` and `training-tasks.json` data should be mapped into this model through an explicit migration. The exact meaning of "work package" and assignment scope remains a product decision and is tracked in `docs/README.md`.

## Consequences

The model supports reporting, RBAC, auditability, and future Work Package workflows. It requires a migration plan and careful compatibility handling while the current frontend still expects title-cased status strings.
