CREATE INDEX IF NOT EXISTS idx_tasks_stage_id ON tasks(stage_id) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(sender_id, receiver_id, created_at DESC);
