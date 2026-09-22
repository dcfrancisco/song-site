# ADR-0012: Complete Domain Table Inventory

- Status: Proposed
- Date: 2026-09-18

## Context

The initial database work created only `tasks` and `training_tasks` to preserve the existing frontend. A complete review of the site shows additional domains: classic Journey cards, user profile and contact workflows, CV, skills, competency, Workday updates, compliance, assets, leadership, home content, song links, external resources, RBAC, and auditability.

## Decision

Use the inventory in [api-data-inventory.md](../api-data-inventory.md) as the complete candidate domain model. Do not treat the first SQLite migration as the complete schema.

The model is organized into these bounded areas:

1. Identity and RBAC
2. User profile and employee data
3. Journey, Work Packages, tasks, training, and status history
4. Workday, compliance, and assets
5. Managed content
6. Organization and reference data
7. Platform audit and migration concerns

Tables should be implemented only after each area has an owner, API contract, authorization policy, lifecycle rules, and migration source mapping. JSON files and browser `localStorage` are source evidence, not a substitute for relational design.

## Consequences

The project avoids prematurely collapsing unrelated workflows into a single task table. It also increases schema and migration work. `WP-014` owns the next step: confirm which candidate tables are required for the first production release and implement them in bounded migrations.
