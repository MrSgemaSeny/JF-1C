-- V127__Add_Google_Sub_And_Email_Otps.sql

-- 1. Google account columns and explicit password_set flag in app_users
ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS google_sub   VARCHAR(64),
    ADD COLUMN IF NOT EXISTS google_email VARCHAR(160),
    ADD COLUMN IF NOT EXISTS password_set BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark password_set = TRUE for existing users with non-null password_hash who registered locally
UPDATE app_users
SET password_set = TRUE
WHERE password_hash IS NOT NULL
  AND auth_provider != 'GOOGLE';

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_google_sub
    ON app_users(google_sub)
    WHERE google_sub IS NOT NULL;

-- 2. Single-use verification OTP table for Gmail protection and email confirmation
CREATE TABLE IF NOT EXISTS email_verification_otps (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                VARCHAR(255) NOT NULL,
    user_id              BIGINT REFERENCES app_users(id) ON DELETE CASCADE,
    otp_code             VARCHAR(10) NOT NULL,
    pre_auth_token       VARCHAR(64) NOT NULL UNIQUE,
    purpose              VARCHAR(32) NOT NULL, -- 'LOGIN', 'REGISTER'
    registration_payload TEXT,                 -- JSON payload storing hashed credentials, never plaintext passwords
    attempts             INT NOT NULL DEFAULT 0,
    last_sent_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at           TIMESTAMP NOT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_token ON email_verification_otps(pre_auth_token);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_verification_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_verification_otps(expires_at);
