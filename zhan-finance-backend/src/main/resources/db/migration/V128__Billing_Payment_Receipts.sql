-- V128__Billing_Payment_Receipts.sql
-- Table for client manual payment receipts (Kaspi / bank transfer PDF receipts)

CREATE TABLE IF NOT EXISTS payment_receipts (
    id                  BIGSERIAL PRIMARY KEY,
    client_id           BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    subscription_id     BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_id          BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    amount              NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'KZT',
    receipt_file_key    TEXT NOT NULL,
    receipt_file_url    TEXT,
    status              VARCHAR(32) NOT NULL DEFAULT 'AWAITING_REVIEW'
                        CHECK (status IN ('AWAITING_REVIEW', 'CONFIRMED', 'REJECTED')),
    reviewed_by         BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    reviewed_at         TIMESTAMP WITH TIME ZONE,
    reject_note         TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_client ON payment_receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status ON payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_created ON payment_receipts(created_at DESC);
