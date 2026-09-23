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

From the repository root:

```powershell
npm install --legacy-peer-deps
cd backend
npm install
cd ..
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead of `Copy-Item`. Use `npm` instead of `npm.cmd` when working outside PowerShell.

Set local values in `.env`, especially:

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_AZURE_REDIRECT_URI=http://localhost:4200/
DB_DRIVER=sqlite
```

Keep real identity values local.

## Optional development environments

The repository supports multiple local profiles:

| Profile | Database | Use when |
| --- | --- | --- |
| Default local | SQLite | Fast frontend/backend development and unit tests without Docker |
| PostgreSQL parity | PostgreSQL 14+ with `pgvector` via Docker/Podman Compose or a shared dev database | Testing migrations, constraints, API integration, and production-like behavior |
| Dev Container | A reproducible Node plus PostgreSQL development environment | Using VS Code, Codespaces, or another IDE with Dev Container support |

Docker/Podman is optional. Do not install or start it for normal SQLite development. When database compatibility matters, use a disposable PostgreSQL 14+ environment and keep its credentials in local environment variables only.

The repository includes an optional `compose.yaml` and `.devcontainer/devcontainer.json`. They are developer tooling only and must remain opt-in; they do not replace the documented SQLite path or silently change `DB_DRIVER`.

Start the production-like local stack from the repository root:

```powershell
docker compose up --build
```

Open `http://localhost:4200`. Nginx serves the frontend and proxies `/api/` to the backend. PostgreSQL is internal to the Compose network and is initialized with PostgreSQL 14 plus pgvector. Stop the stack with `Ctrl+C`, or use `docker compose down`.

To remove the local PostgreSQL data volume as well, use the destructive command:

```powershell
docker compose down -v
```

The Dev Container profile is intended for VS Code, Codespaces, and compatible IDEs. It provides a reproducible Node 24 workspace and forwards the application/database ports. Use the Compose profile when you need the full PostgreSQL-backed stack.

## Initialize the local database

From the repository root, run these commands before starting the backend:

```powershell
cd backend
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:check
cd ..
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

## Build and test

Frontend unit tests:

```powershell
npm run test:ci
```

Backend unit tests:

```powershell
cd backend
npm.cmd test
cd ..
```

Production frontend build:

```powershell
npm run build:ci
```

Run the frontend unit tests followed by the production build:

```powershell
npm run verify
```

The frontend build output is written to `dist/song-site/browser/`. The backend is Node/Express and does not have a separate compile step. New frontend and backend behavior must include colocated unit tests. Playwright FED coverage and PostgreSQL integration CI are planned under `WP-009` and `WP-029`.

Useful repository checks:

```powershell
git diff --check
cd backend
node -e "const fs=require('fs'); const YAML=require('yaml'); YAML.parse(fs.readFileSync('../docs/openapi/song-site.yaml','utf8')); console.log('OpenAPI YAML is valid')"
cd ..
```

## Reset the local database

The reset command is destructive and local-only:

```powershell
cd backend
npm run db:reset
npm run db:migrate
```

Use a disposable `DATABASE_PATH` when testing migrations. The migration files create the schema and populate the local compatibility data; no JSON seed directory is required.

## Deploy the frontend

Deployment is currently GitHub Pages for the static Angular frontend only. The workflow runs automatically when changes are pushed to `main`, or manually from GitHub Actions with the **Deploy Angular to GitHub Pages** workflow.

The workflow:

1. installs root dependencies;
2. validates the required SSO secrets;
3. builds with the `/song-site/` base path;
4. creates the SPA `404.html` fallback;
5. uploads and deploys the Pages artifact.

Configure these repository or environment secrets before deploying:

- `VITE_AZURE_REDIRECT_URI`
- `VITE_ENTRA_CLIENT_ID`
- `VITE_ENTRA_TENANT_ID`

The Pages deployment does not host the Express API or PostgreSQL. Set `VITE_API_BASE_URL` to an externally reachable API when deploying a frontend that needs live data. Do not point a production frontend at `localhost`.

## API and database

- OpenAPI contract: [docs/openapi/song-site.yaml](docs/openapi/song-site.yaml)
- Versioned migrations: `backend/migrations/`.
- Current local database: SQLite through Node `node:sqlite`.
- Production target: PostgreSQL 14+ with `pgvector`, tracked under `WP-017` and `WP-029`; production adapter, migration parity, integration CI, and deployment cutover are not complete yet.
- Database selection is controlled by `DB_DRIVER` (`sqlite` by default). PostgreSQL can use either `DATABASE_URL` or explicit `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` settings; keep `PGPASSWORD` only in local `.env` or a secret manager.
- Local structured data is populated by versioned migrations, including `backend/migrations/004-content-data.sql`; binary and unused frontend assets remain under `src/assets/`.
- PostgreSQL connectivity check: from `backend/`, set `DB_DRIVER=postgres` and `DATABASE_URL` locally, then run `npm run db:postgres:check`; this only verifies `SELECT 1` and does not switch the API off SQLite.

For a future Compose or Dev Container PostgreSQL profile, the expected environment contract is `DB_DRIVER=postgres`, `DATABASE_URL`, and an enabled `vector` extension. Until the PostgreSQL adapter and migration lifecycle are complete, the connectivity check alone does not make the API production-ready.

The GitHub Pages workflow builds only the static frontend. It does not host the Express API, so deployed builds need an externally reachable `VITE_API_BASE_URL`.

## Team standards

Read the shared contract before cross-cutting changes: [docs/ai/team-agent-contract.md](docs/ai/team-agent-contract.md).

Also consult:

- [Architecture decisions](docs/README.md)
- [Work packages](docs/work-packages.md)
- [Local development runbook](docs/runbooks/local-development.md)
- [FED Handbook](docs/handbooks/fed-handbook.md)
- [BED Handbook](docs/handbooks/bed-handbook.md)
- [QA Handbook](docs/handbooks/qa-handbook.md)
- [PostgreSQL Compose runbook](docs/runbooks/postgresql-compose.md)
- [Testing and release runbook](docs/runbooks/testing-and-release.md)
- [Incident response runbook](docs/runbooks/incident-response.md)
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
