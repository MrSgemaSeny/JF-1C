-- V22__Migrate_And_Drop_Service_Requests.sql

-- 1. Ensure task_id column in billing tables
ALTER TABLE invoices ADD COLUMN task_id BIGINT;
ALTER TABLE invoices ADD CONSTRAINT fk_invoice_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

ALTER TABLE subscriptions ADD COLUMN task_id BIGINT;
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscription_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- 2. Migrate billing relations
UPDATE invoices i 
SET task_id = sr.linked_task_id
FROM service_requests sr
WHERE i.service_request_id = sr.id AND sr.linked_task_id IS NOT NULL;

UPDATE subscriptions s
SET task_id = sr.linked_task_id
FROM service_requests sr
WHERE s.service_request_id = sr.id AND sr.linked_task_id IS NOT NULL;

-- 3. Drop old billing relations
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoice_service_request;
ALTER TABLE invoices DROP COLUMN IF EXISTS service_request_id;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscription_service_request;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS service_request_id;

-- 4. Migrate task data
UPDATE tasks t
SET 
  due_date = COALESCE(t.due_date, sr.preferred_contact_date),
  description = CASE 
                  WHEN t.description IS NULL OR t.description = '' THEN sr.client_message
                  WHEN sr.client_message IS NOT NULL AND sr.client_message != '' THEN t.description || CHR(10) || CHR(10) || 'Сообщение клиента: ' || sr.client_message
                  ELSE t.description
                END
FROM service_requests sr
WHERE t.id = sr.linked_task_id;

-- 5. Migrate task_services
INSERT INTO task_services (task_id, service_id)
SELECT linked_task_id, service_id
FROM service_requests
WHERE linked_task_id IS NOT NULL AND service_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Drop service_requests
DROP TABLE service_requests CASCADE;
