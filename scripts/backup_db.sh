#!/usr/bin/env bash
# Script for automated PostgreSQL database backups using pg_dump
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/zhanfinance}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${SPRING_DATASOURCE_URL:-zhanfindb}"
BACKUP_FILE="${BACKUP_DIR}/zhanfinance_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PostgreSQL database backup..."
pg_dump -U "${SPRING_DATASOURCE_USERNAME:-postgres}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Database backup completed successfully: ${BACKUP_FILE}"

# Keep only last 14 days of backups
find "${BACKUP_DIR}" -name "zhanfinance_backup_*.sql.gz" -mtime +14 -delete
echo "[$(date)] Cleaned up backups older than 14 days."
