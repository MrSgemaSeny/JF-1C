# Disaster Recovery & Database Restore Runbook (JF-1C)

## 1. Overview & Objectives

- **RTO (Recovery Time Objective)**: < 30 minutes
- **RPO (Recovery Point Objective)**: < 24 hours (daily automated automated encrypted dumps)
- **Primary Database**: PostgreSQL 17 on Fly.io
- **Backup Location**: Encrypted repository artifacts / Cloudflare R2 / Telegram notification channel

---

## 2. Automated Daily Backup Verification

The automated backup job runs daily via GitHub Actions (`.github/workflows/db-backup.yml`):
1. Dumps schema and data using `pg_dump -Fc -Z 9`.
2. Validates non-empty backup archive.
3. Notifies admins via Telegram bot with checksum and size metrics.

---

## 3. Step-by-Step Restoration Procedure

### 3.1. Restoring on a Local or Ephemeral Staging Instance
```bash
# 1. Start clean PostgreSQL 17 instance
docker run --name jf1c_restore_test -e POSTGRES_PASSWORD=restore_pass -e POSTGRES_DB=zhanfindb -p 5433:5432 -d postgres:17-alpine

# 2. Wait for PostgreSQL initialization
until docker exec jf1c_restore_test pg_isready -U postgres; do sleep 1; done

# 3. Restore dump
docker exec -i jf1c_restore_test pg_restore -U postgres -d zhanfindb --clean --if-exists < backup_latest.dump

# 4. Verify table integrity and row counts
docker exec -it jf1c_restore_test psql -U postgres -d zhanfindb -c "SELECT count(*) FROM app_users; SELECT count(*) FROM invoices; SELECT count(*) FROM refresh_tokens;"

# 5. Cleanup
docker stop jf1c_restore_test && docker rm jf1c_restore_test
```

### 3.2. Restoring to Fly.io Production / Staging
1. Retrieve the latest verified dump file.
2. Put the frontend into maintenance mode or scale backend to 0:
   ```bash
   fly scale count 0 -a zhanfinance
   ```
3. Connect proxy to Fly.io Postgres cluster:
   ```bash
   fly proxy 5433:5432 -a zhanfinance-db
   ```
4. Perform restoration:
   ```bash
   pg_restore -h localhost -p 5433 -U postgres -d zhanfindb --clean --if-exists backup_latest.dump
   ```
5. Scale backend back to 1 and verify health:
   ```bash
   fly scale count 1 -a zhanfinance
   curl -f https://zhanfinance.fly.dev/api/actuator/health
   ```

---

## 4. Disaster Recovery Drill Testing
Automated restore drills run via `.github/workflows/restore-drill.yml` on an ephemeral PostgreSQL 17 container in GitHub Actions to guarantee dump restorability without data corruption.
