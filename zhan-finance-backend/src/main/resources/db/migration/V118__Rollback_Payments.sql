DROP TABLE IF EXISTS payments;
ALTER TABLE invoices DROP COLUMN IF EXISTS subscription_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS fiscal_receipt_url;
