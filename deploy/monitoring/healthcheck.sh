#!/usr/bin/env sh
set -eu
base=${HAULMATCH_HEALTH_URL:-https://haulmatch.wykiesautomation.co.za}
curl -fsS "$base/health/live" >/dev/null
curl -fsS "$base/health/ready" >/dev/null
echo "HaulMatch health checks passed"
