#!/usr/bin/env bash

set -Eeuo pipefail

for migration in /opt/song-site-migrations/*.sql; do
  echo "Applying PostgreSQL migration ${migration}"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --file "$migration"
done
