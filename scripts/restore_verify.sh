#!/usr/bin/env sh
set -eu
dump=${1:?Usage: scripts/restore_verify.sh backup.dump}
test -f "$dump"
docker compose -f docker-compose.production.yml exec -T db psql -U haulmatch -c 'DROP DATABASE IF EXISTS haulmatch_restore_test;'
docker compose -f docker-compose.production.yml exec -T db psql -U haulmatch -c 'CREATE DATABASE haulmatch_restore_test;'
cat "$dump" | docker compose -f docker-compose.production.yml exec -T db pg_restore -U haulmatch -d haulmatch_restore_test
count=$(docker compose -f docker-compose.production.yml exec -T db psql -U haulmatch -d haulmatch_restore_test -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
test "$count" -gt 0
echo "Restore verification passed with $count public tables"
