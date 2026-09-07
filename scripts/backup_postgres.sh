#!/usr/bin/env sh
set -eu
mkdir -p backups
STAMP=$(date +%Y%m%d_%H%M%S)
docker compose -f docker-compose.production.yml exec -T db pg_dump -U haulmatch -Fc haulmatch > "backups/haulmatch_${STAMP}.dump"
echo "Created backups/haulmatch_${STAMP}.dump"
