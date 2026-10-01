# Azure Container Apps Deployment Readiness

## Current local architecture

```text
Browser
  -> frontend container (Nginx, host port 4200, container port 80)
  -> /api/* proxy to backend container
  -> backend container (Express, internal port 5001)
  -> postgres container (PostgreSQL 14 + pgvector, internal port 5432)
```

Compose service names are `frontend`, `backend`, and `postgres`. PostgreSQL is not published to the host. The frontend uses same-origin `/api` in the Docker image, so it does not require a localhost API URL.

## Containers and ports

| Service | Image/build | Container port | Host port |
| --- | --- | ---: | ---: |
| `frontend` | Angular production build served by Nginx | 80 | 4200 |
| `backend` | Node/Express production image | 5001 | not published |
| `postgres` | `pgvector/pgvector:pg14` | 5432 | not published |

The host ports can be changed with `FRONTEND_PORT` and `BACKEND_PORT` in the local environment.

## Environment variables

Frontend `VITE_*` values are compile-time, public configuration embedded into the Angular bundle. They are not secrets:

- `VITE_AZURE_REDIRECT_URI`
- `VITE_ENTRA_CLIENT_ID`
- `VITE_ENTRA_TENANT_ID`
- `VITE_API_BASE_URL`

The existing MSAL implementation and fallback behavior are preserved. Docker uses the same-origin `/api` fallback and Nginx proxy, so `VITE_API_BASE_URL` is not required for the Compose production image.

Backend/database values are runtime configuration:

- `NODE_ENV`
- `PORT` / `BACKEND_PORT`
- `DB_DRIVER=postgres`
- `DATABASE_URL`
- `PGSSL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `TEMP_CONTENT_API_KEY` (local compatibility key only; not a production authorization mechanism)

Use `.env.example` as the template. Do not commit `.env.local`, `.env`, database passwords, or production secrets.

## Health endpoints

- `GET /health/live`: process liveness; returns HTTP 200 while Express is running.
- `GET /health/ready`: dependency readiness; checks PostgreSQL when `DB_DRIVER=postgres`, returning HTTP 200 or 503.

The backend listens on `0.0.0.0` inside its container. Compose health checks use `/health/ready` before the frontend is started.

## PostgreSQL initialization and migrations

The Compose initialization directory creates the local deployment-path schema and seed data on a new PostgreSQL volume. It then applies every file in `backend/migrations-postgres/`, including `009-sqlite-parity.sql`. The `pgvector` extension is enabled by the initialization SQL.

The PostgreSQL schema requests only the `vector` extension. Azure Database for PostgreSQL does not allow-list `pgcrypto`; PostgreSQL 16's built-in `gen_random_uuid()` function is used instead.

The Docker smoke test also creates a temporary clean database and applies every file in `backend/migrations-postgres/` with `ON_ERROR_STOP=1`. It verifies the `vector` extension, representative tables, and API parity counts for leadership, home spotlight, tasks, and song links.

To reset the local PostgreSQL database and initialize it from scratch:

```bash
docker compose down -v
docker compose up --build -d
npm run test:docker
```

The `down -v` command is destructive to local Compose data.

## Exact build and test commands

```bash
docker compose build
docker compose up -d
npm run test:docker
npm run test:ci
(cd backend && npm test)
```

## Validation results

The local validation completed successfully:

- Docker Compose build: passed.
- Angular production build in the frontend image: passed, with existing bundle-budget warnings.
- PostgreSQL/pgvector container: passed.
- Backend liveness/readiness: passed.
- Frontend root and SPA fallback: passed.
- Frontend `/api` proxy: passed.
- Representative PostgreSQL-backed API reads: passed.
- SQLite/PostgreSQL parity API counts: passed for leadership, spotlight, tasks, and song links.
- Frontend tests: 29 test files, 35 tests passed.
- Backend tests: 2 tests passed.

## Remaining Azure-only work

- The workflow [publish-azure-images.yml](../.github/workflows/publish-azure-images.yml) publishes commit-tagged images after tests and Docker smoke validation using GitHub OIDC.
- The exact image names are `<AZURE_ACR_LOGIN_SERVER>/song-site-web:<GITHUB_SHA>` and `<AZURE_ACR_LOGIN_SERVER>/song-site-api:<GITHUB_SHA>`.
- Create Azure resource groups, ACR, Container Apps environment, Container Apps, PostgreSQL Flexible Server, and monitoring resources.
- Decide public versus private PostgreSQL networking.
- Push immutable frontend/backend images to ACR.
- Configure Container Apps managed identity with `AcrPull`.
- Configure production runtime secrets through Azure-managed secret storage.
- Configure the production frontend API origin and Container Apps networking.
- Complete Entra API scope, access-token acquisition, backend token validation, and RBAC before production writes are enabled.
- Add GitHub Actions OIDC and deployment workflow later.

No Azure resources, client secrets, or Azure-specific URLs are introduced by this local readiness work. The image-publishing workflow is present, but it does not create Azure resources or use client-secret authentication.

The workflow file is present, but its GitHub Actions execution and ACR push were not executed from this local workspace because they require the remote GitHub OIDC context and Azure access.
