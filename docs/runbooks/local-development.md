# Local Development

## Environment

Copy `.env.example` to `.env` and set the local identity values. The backend loads the root `.env` through `dotenv`.

| Variable | Local default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Enables local development behavior. |
| `PORT` | `5001` | Backend HTTP port. |
| `DATABASE_PATH` | `.local/song-site.sqlite` | SQLite database file, ignored by Git. |
| `DATABASE_URL` | unset locally | PostgreSQL connection string; required for PostgreSQL environments and never committed. |
| `SWAGGER_UI` | `true` | Enables local Swagger UI when `NODE_ENV=development`. |
| `VITE_API_BASE_URL` | `http://localhost:5001/api` | Frontend API base URL. |
| `VITE_AZURE_REDIRECT_URI` | `http://localhost:4200/` | Frontend identity redirect. |
| `VITE_ENTRA_CLIENT_ID` | project-specific | Frontend identity client. |
| `VITE_ENTRA_TENANT_ID` | project-specific | Frontend identity tenant. |

## First-time setup

From the repository root in PowerShell:

```powershell
npm install --legacy-peer-deps
Copy-Item .env.example .env
```

Set local values in `.env`, especially `VITE_API_BASE_URL=http://localhost:5001/api` and `VITE_AZURE_REDIRECT_URI=http://localhost:4200/`. Then install backend dependencies:

```powershell
cd backend
npm install
```

## Start the backend: Terminal 1

From `backend/`:

```powershell
npm run db:migrate
npm run db:seed
npm run db:check
npm start
```

The migration and seed commands are idempotent for the current SQLite setup. `db:reset` is destructive: it removes the configured local database file and should only be used when rebuilding local data is intentional.

When `NODE_ENV=development` and `SWAGGER_UI=true`, browse the contract at `http://localhost:5001/api-docs`.

## Start the frontend: Terminal 2

Open a second terminal at the repository root:

```powershell
npm start
```

Open `http://localhost:4200`.

## Validation

From the repository root:

```powershell
npm run test:ci
npm run build:ci
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
npm run db:seed
```

## Production rule

Production must set `NODE_ENV=production`. The backend does not mount `/api-docs` in production, regardless of the OpenAPI file being present in the repository. Production secrets must be configured through the deployment environment, not committed `.env` files.

## PostgreSQL integration status

The backend now supports an explicit PostgreSQL adapter selected with `DB_DRIVER=postgres` and `DATABASE_URL`. The production-like Compose profile uses PostgreSQL 14 with `pgvector`; use [the PostgreSQL Compose runbook](postgresql-compose.md) for startup and verification.

SQLite remains the fast local default. It is not fully compatible with PostgreSQL, so API, migration, constraint, and vector-related changes must also be checked against Compose PostgreSQL before promotion. Adapter parity, managed backups, production secret management, and deployment cutover remain operational work and must not be inferred from a successful local SQLite test.

## Production-readiness warning

The GitHub Pages workflow hosts only the static frontend and does not host the Express API or PostgreSQL. SSO-compatible authorization and leadership content mutation require the production identity/RBAC integration and deployment configuration to be verified separately. Do not treat the local Compose content key as a production credential.
