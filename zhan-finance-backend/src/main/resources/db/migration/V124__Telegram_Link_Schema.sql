-- V124__Telegram_Link_Schema.sql
-- Table for linking JF-1C users with Telegram chat IDs
CREATE TABLE IF NOT EXISTS telegram_links (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
    chat_id             BIGINT NOT NULL UNIQUE,
    telegram_username   VARCHAR(64),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    linked_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for 15-minute temporary link tokens
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    token               VARCHAR(64) PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tg_links_chat_id ON telegram_links(chat_id);
CREATE INDEX IF NOT EXISTS idx_tg_links_user_id ON telegram_links(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_link_tokens_expires ON telegram_link_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_tg_link_tokens_user_id ON telegram_link_tokens(user_id);
