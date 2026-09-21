-- V125__Telegram_Outbox.sql
-- Outbox queue for reliable asynchronous Telegram dispatching
CREATE TABLE IF NOT EXISTS telegram_notifications (
    id                  BIGSERIAL PRIMARY KEY,
    chat_id             BIGINT NOT NULL,
    user_id             BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    message             TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts            INTEGER NOT NULL DEFAULT 0,
    max_attempts        INTEGER NOT NULL DEFAULT 3,
    last_error          TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMP WITH TIME ZONE
);

-- Partial index for fast pending queue polling
CREATE INDEX IF NOT EXISTS idx_tg_notif_pending ON telegram_notifications(created_at)
    WHERE status = 'PENDING';

-- Composite index for status inspection and archival cleanup
CREATE INDEX IF NOT EXISTS idx_tg_notif_cleanup ON telegram_notifications(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tg_notif_user_id ON telegram_notifications(user_id);
