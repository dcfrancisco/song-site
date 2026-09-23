# PostgreSQL Compose Runbook

Use this runbook for the production-like local stack: PostgreSQL 14 with `pgvector`, the backend using the PostgreSQL adapter, and the Angular application behind Nginx.

## Preconditions

- Docker or Podman Compose is installed and running.
- Ports `4200` and the internal Compose ports are available.
- No real credentials are needed; the checked-in Compose password is local-only.

## Start

From the repository root:

```bash
docker compose up --build
```

Open `http://localhost:4200`. The frontend is served by Nginx; `/api/` is proxied to the backend. PostgreSQL is not exposed to the host by default.

## Verify

```bash
docker compose ps
docker compose exec -T postgres pg_isready -U song_site -d song_site
docker compose exec -T postgres psql -U song_site -d song_site -c "select version();"
docker compose exec -T postgres psql -U song_site -d song_site -c "select extname from pg_extension where extname = 'vector';"
curl http://localhost:4200/api/leadership
curl http://localhost:4200/api/leadership/orgchart
```

Confirm backend logs do not show a SQLite adapter being selected. The backend container must have `DB_DRIVER=postgres` and a `DATABASE_URL` using the `postgres` service name.

## Local content mutation

Compose uses a temporary local content key for the current leadership mutation path:

```bash
curl -X POST http://localhost:4200/api/leadership/orgchart \
  -H 'content-type: application/json' \
  -H 'x-admin-key: compose-local-content-key' \
  -d '{"name":"Example Lead","role":"Practice Lead","parentId":1,"sortOrder":1}'
```

This key is not a production identity or RBAC solution. Do not reuse it outside the disposable local stack.

## Stop and reset

Stop while preserving data:

```bash
docker compose down
```

Destroy the local PostgreSQL volume and reinitialize seed data:

```bash
docker compose down -v
docker compose up --build
```

The second command is destructive to local Compose data. Confirm that no needed test records remain before running it.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Backend cannot connect | Check `docker compose ps`, PostgreSQL health, and backend logs. |
| API returns old data | The named volume may contain an earlier initialization; use `down -v` only when reset is acceptable. |
| Frontend shows 502 | Check backend logs and that PostgreSQL passed its healthcheck. |
| `databasePath` appears in diagnostics | This is a default config field; adapter selection is controlled by `DB_DRIVER`. |
| Port already in use | Stop the conflicting process or change the frontend host port in Compose. |

