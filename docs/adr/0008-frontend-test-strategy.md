# ADR-0008: Frontend Test Strategy

- Status: Accepted
- Date: 2026-09-18

## Context

The frontend contains many component specs and a Playwright production smoke-test draft. Unit tests and browser tests serve different purposes: unit tests provide fast feedback on isolated behavior, while browser tests verify that routing, rendering, authentication, and API integration work together.

## Decision

Use a layered frontend test strategy:

- **Unit tests:** Angular/Vitest tests for components, services, route behavior, status transitions, and permission rules.
- **Playwright tests:** browser tests for critical user workflows, especially authentication, Journey navigation, My Journey task completion, and protected actions.
- **Build verification:** production Angular build on every pull request.
- **Pull requests:** run unit tests, build verification, and a focused Playwright smoke suite.
- **Release validation:** run the complete Playwright suite against a controlled staging or preview environment.

Playwright must not target mutable production data by default. Test data must be isolated and resettable. The Playwright configuration and scripts will be added under `WP-009`.

## Trade-offs

Browser tests are slower and can be more sensitive to environment timing than unit tests. This cost is accepted because critical workflows need real-browser coverage. The suite will stay useful by keeping most logic in unit tests and reserving Playwright for user-visible integration paths.

## Consequences

The project gets confidence at both the code and workflow levels, but CI duration increases. The pipeline should publish test artifacts and use focused smoke tests for pull requests while reserving the full suite for release validation.
