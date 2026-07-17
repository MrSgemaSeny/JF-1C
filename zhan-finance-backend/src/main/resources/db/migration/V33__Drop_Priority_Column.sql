-- Drop priority column if Flyway V24/V26 did not apply it
ALTER TABLE tasks DROP COLUMN IF EXISTS priority;

-- Add deadline_notified_at column if Flyway V31 did not apply it
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline_notified_at TIMESTAMP;
