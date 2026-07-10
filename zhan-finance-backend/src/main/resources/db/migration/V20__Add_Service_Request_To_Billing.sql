ALTER TABLE invoices
ADD COLUMN service_request_id BIGINT;

ALTER TABLE invoices
ADD CONSTRAINT fk_invoice_service_request
FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE SET NULL;

ALTER TABLE subscriptions
ADD COLUMN service_request_id BIGINT;

ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscription_service_request
FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE SET NULL;
