#!/usr/bin/env sh
set -eu
FILE=${1:?Usage: restore_postgres.sh backup.dump}
test -f "$FILE"
cat "$FILE" | docker compose -f docker-compose.production.yml exec -T db pg_restore -U haulmatch -d haulmatch --clean --if-exists
