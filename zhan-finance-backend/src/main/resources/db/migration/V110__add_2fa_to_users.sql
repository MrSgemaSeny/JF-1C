ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64),
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS two_factor_pre_auth (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token       VARCHAR(128) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_auth_token   ON two_factor_pre_auth(token);
CREATE INDEX IF NOT EXISTS idx_pre_auth_expires ON two_factor_pre_auth(expires_at);
