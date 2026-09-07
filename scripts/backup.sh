#!/usr/bin/env sh
set -eu
mkdir -p backups
stamp=$(date +%Y%m%d_%H%M%S)
docker compose -f docker-compose.production.yml exec -T db pg_dump -U haulmatch -Fc haulmatch > "backups/haulmatch_${stamp}.dump"
tar -czf "backups/uploads_${stamp}.tar.gz" -C . deploy 2>/dev/null || true
echo "Backup completed: ${stamp}"
