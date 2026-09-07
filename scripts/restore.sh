#!/usr/bin/env sh
set -eu
file=${1:?Usage: scripts/restore.sh backups/file.dump}
test -f "$file"
cat "$file" | docker compose -f docker-compose.production.yml exec -T db pg_restore -U haulmatch -d haulmatch --clean --if-exists
