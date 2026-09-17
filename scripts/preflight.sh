#!/usr/bin/env sh
set -eu
test -f .env.production || { echo "Missing .env.production"; exit 1; }
test -f deploy/certs/origin.pem || { echo "Missing deploy/certs/origin.pem"; exit 1; }
test -f deploy/certs/origin.key || { echo "Missing deploy/certs/origin.key"; exit 1; }
grep -q 'REPLACE_' .env.production && { echo "Replace all placeholders in .env.production"; exit 1; } || true
docker compose -f docker-compose.production.yml config >/dev/null
echo "HaulMatch preflight passed"
