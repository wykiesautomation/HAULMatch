#!/usr/bin/env sh
set -eu
sh scripts/preflight.sh
docker compose -f docker-compose.production.yml build --pull
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml ps
