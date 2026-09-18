# Song Site

Song Site is an Angular frontend with an Express backend for the ATCP Song Bench experience.

- `src/`: Angular 21 standalone application.
- `backend/`: Express 5 API and database repository.
- `docs/`: OpenAPI contract, architecture decisions, work packages, and runbooks.

## Prerequisites

- Node.js 22 or newer.
- npm 11 or compatible npm version.
- Local identity configuration when working on SSO.

Do not commit `.env`, database files, credentials, tokens, or identity secrets.

## First-time setup

From the repository root in PowerShell:

```powershell
npm install --legacy-peer-deps
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead of `Copy-Item`.

Set local values in `.env`, especially:

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_AZURE_REDIRECT_URI=http://localhost:4200/
DB_DRIVER=sqlite
```

Keep real identity values local.

## Initialize the local database

From the repository root, run these commands before starting the backend:

```powershell
cd backend
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:check
```

`db:migrate` creates the SQLite schema and applies all versioned migrations. The current content is populated by `004-content-data.sql`. `db:seed` is retained as a compatibility command; it does not read JSON files. `db:check` confirms the local database is available and reports the task counts.

If PowerShell allows the `npm` command directly, `npm` may be used instead of `npm.cmd`.

## Start the backend: Terminal 1

```powershell
cd backend
npm.cmd install
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:check
npm.cmd start
```

Backend URL: `http://localhost:5001`

Swagger UI: `http://localhost:5001/api-docs` when `NODE_ENV=development` and `SWAGGER_UI=true`.

## Start the frontend: Terminal 2

Open a second terminal at the repository root:

```powershell
npm start
```

Open `http://localhost:4200`.

If port 4200 is unavailable:

```powershell
npm start -- --port 4201
```

Update `VITE_AZURE_REDIRECT_URI` to match when testing SSO on another port.

## Useful checks

From the repository root:

```powershell
npm run test:ci
npm run build:ci
npm run verify
```

From `backend/`:

```powershell
npm test
```

## Reset the local database

The reset command is destructive and local-only:

```powershell
cd backend
npm run db:reset
npm run db:migrate
```

Use a disposable `DATABASE_PATH` when testing migrations. The migration files create the schema and populate the local compatibility data; no JSON seed directory is required.

## API and database

- OpenAPI contract: [docs/openapi/song-site.yaml](docs/openapi/song-site.yaml)
- Versioned migrations: `backend/migrations/`.
- Current local database: SQLite through Node `node:sqlite`.
- Production target: PostgreSQL, tracked under `WP-017`; PostgreSQL is not wired into the current backend yet.
- Database selection is controlled by `DB_DRIVER` (`sqlite` by default). PostgreSQL can use either `DATABASE_URL` or explicit `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` settings; keep `PGPASSWORD` only in local `.env` or a secret manager.
- Local structured data is populated by versioned migrations, including `backend/migrations/004-content-data.sql`; binary and unused frontend assets remain under `src/assets/`.
- PostgreSQL connectivity check: from `backend/`, set `DATABASE_URL` locally and run `npm run db:postgres:check`; this only verifies `SELECT 1` and does not switch the API off SQLite.

The GitHub Pages workflow builds only the static frontend. It does not host the Express API, so deployed builds need an externally reachable `VITE_API_BASE_URL`.

## Team standards

Read the shared contract before cross-cutting changes: [docs/ai/team-agent-contract.md](docs/ai/team-agent-contract.md).

Also consult:

- [Architecture decisions](docs/README.md)
- [Work packages](docs/work-packages.md)
- [Local development runbook](docs/runbooks/local-development.md)
- [API and data inventory](docs/api-data-inventory.md)
- [Navigation flows](docs/navigation-flows.md)

Important rules:

- API changes are OpenAPI-first.
- Database changes are migration-backed.
- Authorization is enforced by the backend, not only Angular navigation.
- Keep ADR status, implementation status, and work-package status separate.
- Preserve unrelated worktree changes.

## Pull request checklist

- [ ] Frontend and backend behavior are described separately.
- [ ] OpenAPI is updated for API changes.
- [ ] A versioned migration strategy exists for database changes.
- [ ] Focused tests or smoke checks pass.
- [ ] `git diff --check` passes.
- [ ] Relevant documentation is updated.
- [ ] No secrets or local database files are included.
