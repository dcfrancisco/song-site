# FED Handbook

Frontend engineering guide for Song Site. This handbook is written for associates through advanced engineers and is the day-to-day companion to the ADRs.

## 1. What you are working on

Song Site is an Angular 21 standalone application in `src/`. It provides the Song Bench experience, public/guest navigation, authenticated user journeys, leadership content, and the frontend side of the SSO experience.

The frontend is responsible for:

- page composition, navigation, responsive presentation, and accessibility;
- calling the backend through typed service boundaries;
- presenting authenticated and guest states without bypassing backend authorization;
- local UI state and form validation;
- unit tests colocated with the feature under test; and
- Playwright journeys when a behavior crosses routing, authentication state, or the API boundary.

The frontend is not responsible for deciding whether a user may mutate data. The backend remains authoritative for authentication and authorization.

## 2. Repository map

| Area | Location | Guidance |
| --- | --- | --- |
| App bootstrap and routes | `src/app/app.config.ts`, `src/app/app.routes.ts` | Keep route configuration explicit and lazy-load feature areas where practical. |
| Authentication | `src/app/auth/` | Preserve MSAL redirect handling, active-account selection, and redirect URI normalization. |
| Shared navigation | `src/app/navbar/`, `src/app/footer/` | Guest menus may be visible; edit controls must reflect effective permission and API responses. |
| ATCP Song | `src/app/atcp-song/` | Prefer service/model boundaries over direct HTTP calls in components. |
| Journey | `src/app/song-bench/` | Keep task-specific behavior in its feature folder and preserve existing route names. |
| Tests | Beside source files | Use the existing `*.spec.ts` or `*.specs.ts` naming convention. |
| API contract | `docs/openapi/song-site.yaml` | Update the contract before changing a public API call. |

## 3. Standard feature workflow

1. Read the relevant ADR, work package, API contract, and navigation flow.
2. Identify the guest, authenticated, read-only, and edit states before writing UI code.
3. Add or update the model and service boundary.
4. Add the component/template/styles with accessible labels, keyboard behavior, and responsive layout.
5. Add colocated unit tests for the service and component behavior.
6. Add or update a Playwright test for a critical user journey when the route/API/auth boundary is involved.
7. Run focused tests, the full frontend suite, production build, and `git diff --check`.
8. Document API, permission, migration, or deployment changes before opening the pull request.

## 4. SSO rules

The application uses MSAL browser redirect flow. Do not replace it with a local mock in production code or alter the redirect behavior to make a test pass.

- Use `AuthService` as the frontend identity boundary.
- Do not log access tokens, claims, or personally identifiable information.
- Keep `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID`, and redirect values in environment configuration.
- A guest is an unauthenticated visitor, not an anonymous editor.
- A signed-in user may still be read-only; render edit controls only when the permission contract says they are allowed.
- Always handle initialization and redirect-loading states so the UI does not briefly show the wrong access state.

## 5. Leadership and org chart UI

The leadership diagram is an org-chart presentation only. Do not copy branding, logos, or decorative labels from the mock image into the product.

The UI should:

- load the chart from the leadership API;
- preserve parent-child relationships and sort order;
- show a read-only view to guests and users without edit permission;
- show create, edit, and delete affordances only to users with the matching permission;
- report API validation and authorization errors without silently losing edits; and
- refresh or reconcile the view after a successful mutation.

The backend is the source of truth for permission checks. Hiding a button is only a usability improvement, not a security control.

## 6. Angular implementation standards

- Prefer standalone components and explicit imports.
- Keep components focused on presentation and orchestration; put reusable API behavior in services.
- Use signals and computed state consistently with the existing application style.
- Avoid subscriptions that are not cleaned up; prefer Angular lifecycle-safe patterns.
- Give interactive controls accessible names and visible focus states.
- Do not add a new global dependency for a feature that can use existing Angular APIs.
- Keep CSS local to the feature unless a style is intentionally shared.
- Preserve existing URLs and deep-link behavior.
- Do not store server-authoritative mutations only in `localStorage`.

## 7. Frontend testing

Minimum expectation for new code:

- service tests cover successful response mapping, failure handling, and request shape;
- component tests cover rendering, user interaction, loading/error/empty states, and permission-sensitive controls;
- route or auth-sensitive behavior has a Playwright test when practical;
- regression tests are added for every fixed defect.

Useful commands from the repository root:

```bash
npm run test:ci
npm run build:ci
npm run verify
```

The current repository has Playwright coverage for production/SSO skip behavior in `playwright-prod-skip-sso.spec.ts`; expand it with real authenticated fixtures only when the test environment can provide them safely.

## 8. Definition of done

- Feature works for guest, authenticated read-only, and authorized edit states.
- SSO redirect and logout behavior is unchanged unless explicitly documented.
- API and OpenAPI changes agree.
- Unit tests are colocated and pass.
- Relevant Playwright coverage exists or the pull request records why it is deferred.
- Production build passes without introducing avoidable warnings.
- No secrets, tokens, generated databases, or local environment files are committed.

