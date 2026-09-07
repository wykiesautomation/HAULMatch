#!/usr/bin/env sh
set -eu
root=$(pwd)
line="15 2 * * * cd $root && sh scripts/backup_verified.sh >> backups/backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'backup_verified.sh'; echo "$line" ) | crontab -
echo "Daily backup scheduled at 02:15 server time"
