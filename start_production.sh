#!/usr/bin/env sh
set -eu
python scripts/preflight.py
alembic upgrade head
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --proxy-headers --forwarded-allow-ips='*'
