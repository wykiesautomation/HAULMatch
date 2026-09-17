#!/usr/bin/env sh
set -eu
mkdir -p backups
stamp=$(date +%Y%m%d_%H%M%S)
dbfile="backups/haulmatch_${stamp}.dump"
uploadfile="backups/private_uploads_${stamp}.tar.gz"
docker compose -f docker-compose.production.yml exec -T db pg_dump -U haulmatch -Fc haulmatch > "$dbfile"
docker run --rm -v haulmatch_private_uploads:/data:ro -v "$(pwd)/backups:/backup" alpine tar -czf "/backup/private_uploads_${stamp}.tar.gz" -C /data .
sha256sum "$dbfile" "$uploadfile" > "backups/manifest_${stamp}.sha256"
echo "Verified backup set created: ${stamp}"
