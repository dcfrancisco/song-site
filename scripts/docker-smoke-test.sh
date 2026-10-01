#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FRONTEND_PORT="${FRONTEND_PORT:-4200}"
POSTGRES_USER="${POSTGRES_USER:-song_site}"
POSTGRES_DB="${POSTGRES_DB:-song_site}"
MIGRATION_DB="song_site_migration_smoke"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

on_error() {
  echo "Docker smoke test failed. Recent container state and logs:" >&2
  docker compose ps >&2 || true
  docker compose logs --tail=120 postgres backend frontend >&2 || true
}

cleanup_migration_db() {
  docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
    -c "DROP DATABASE IF EXISTS ${MIGRATION_DB};" >/dev/null 2>&1 || true
}

trap on_error ERR
trap cleanup_migration_db EXIT

wait_for() {
  local description="$1"
  shift
  for _attempt in $(seq 1 30); do
    if "$@"; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for ${description}." >&2
  return 1
}

postgres_ready() {
  docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1
}

backend_ready() {
  docker compose exec -T backend node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5001) + '/health/ready').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" >/dev/null 2>&1
}

echo "Starting Docker Compose stack..."
docker compose up -d

echo "Waiting for PostgreSQL..."
wait_for "PostgreSQL" postgres_ready

echo "Waiting for backend readiness..."
wait_for "backend readiness" backend_ready

echo "Checking PostgreSQL pgvector extension..."
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT 1 FROM pg_extension WHERE extname = 'vector';" | grep -q 1

echo "Validating all PostgreSQL migration files against a clean database..."
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS ${MIGRATION_DB};" >/dev/null
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
  -c "CREATE DATABASE ${MIGRATION_DB};" >/dev/null
for migration in backend/migrations-postgres/*.sql; do
  echo "  applying ${migration}"
  docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$MIGRATION_DB" < "$migration" >/dev/null
done
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$MIGRATION_DB" \
  -c "SELECT 1 FROM pg_extension WHERE extname = 'vector';" | grep -q 1
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$MIGRATION_DB" \
  -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks';" | grep -q 1

echo "Checking backend liveness and readiness..."
docker compose exec -T backend node -e "Promise.all(['/health/live', '/health/ready'].map(path => fetch('http://127.0.0.1:' + (process.env.PORT || 5001) + path).then(async response => { if (!response.ok) throw new Error(path + ' returned ' + response.status); console.log(path + ' OK'); return response.json(); }))).catch(error => { console.error(error); process.exit(1); })"

echo "Checking frontend and SPA fallback..."
curl --fail --silent --show-error "$FRONTEND_URL/" >/dev/null
curl --fail --silent --show-error "$FRONTEND_URL/home" >/dev/null

echo "Checking frontend /api proxy and representative database operation..."
curl --fail --silent --show-error "$FRONTEND_URL/api/leadership" > /tmp/song-site-leadership.json
curl --fail --silent --show-error "$FRONTEND_URL/api/tasks" > /tmp/song-site-tasks.json
curl --fail --silent --show-error "$FRONTEND_URL/api/home/spotlight" > /tmp/song-site-home-spotlight.json
curl --fail --silent --show-error "$FRONTEND_URL/api/song-links" > /tmp/song-site-song-links.json
node -e "const fs = require('fs'); const leadership = JSON.parse(fs.readFileSync('/tmp/song-site-leadership.json', 'utf8')); const tasks = JSON.parse(fs.readFileSync('/tmp/song-site-tasks.json', 'utf8')); const spotlight = JSON.parse(fs.readFileSync('/tmp/song-site-home-spotlight.json', 'utf8')); const songLinks = JSON.parse(fs.readFileSync('/tmp/song-site-song-links.json', 'utf8')); const cards = songLinks.reduce((total, group) => total + group.cards.length, 0); if ((leadership.marketLeads?.length ?? 0) !== 2 || (leadership.practiceLeads?.length ?? 0) !== 4 || (leadership.capabilityLeads?.length ?? 0) !== 4 || (leadership.enablementChampions?.length ?? 0) !== 7 || !tasks.length || spotlight.persons?.length !== 4 || cards !== 14) { throw new Error('PostgreSQL parity API counts did not match the SQLite data contract'); } console.log('API proxy, PostgreSQL data, and SQLite parity counts OK');"

echo "Docker smoke test passed."
