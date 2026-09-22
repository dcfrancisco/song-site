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

PostgreSQL is the production target, but it is not wired into the current backend yet. `DATABASE_URL` is reserved for the future PostgreSQL adapter; setting it does not currently switch the runtime away from SQLite. The integration work is tracked in `WP-017` and must add a driver, adapter selection, PostgreSQL migration execution, CI parity, backups, and rollback or forward-fix procedures before production use.

## Production-readiness warning

The local API is not production-ready yet. Mutation endpoints do not currently enforce authentication or authorization, the classic Journey UI still stores updates in `localStorage`, backend automated tests are not present, and GitHub Pages does not host the API. These gaps are tracked under `WP-018` and must be resolved before production promotion.
