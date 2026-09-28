-- V129__Subscription_Add_Pending_Status.sql
-- Add status constraint supporting PENDING, ACTIVE, PAUSED, CANCELED

ALTER TABLE subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('PENDING', 'ACTIVE', 'PAUSED', 'CANCELED'));
