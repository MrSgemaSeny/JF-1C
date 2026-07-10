CREATE TABLE pipelines (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stages (
    id BIGSERIAL PRIMARY KEY,
    pipeline_id BIGINT NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    order_index INT NOT NULL,
    color VARCHAR(7),
    type VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Pipeline
INSERT INTO pipelines (name, is_default) VALUES ('Общая воронка', true);

-- Insert Default Stages mapping old TaskStatus
INSERT INTO stages (pipeline_id, name, order_index, color, type, is_default) VALUES 
((SELECT id FROM pipelines WHERE is_default = true), 'Новый', 0, '#3b82f6', 'OPEN', true),
((SELECT id FROM pipelines WHERE is_default = true), 'В работе', 1, '#eab308', 'OPEN', false),
((SELECT id FROM pipelines WHERE is_default = true), 'На проверке', 2, '#f97316', 'OPEN', false),
((SELECT id FROM pipelines WHERE is_default = true), 'Успешно завершен', 3, '#22c55e', 'WON', false),
((SELECT id FROM pipelines WHERE is_default = true), 'Отменен', 4, '#ef4444', 'LOST', false);

-- Alter tasks table
ALTER TABLE tasks ADD COLUMN stage_id BIGINT REFERENCES stages(id);
ALTER TABLE tasks ADD COLUMN amount DECIMAL(19,4);
ALTER TABLE tasks ADD COLUMN currency VARCHAR(3);
ALTER TABLE tasks ADD COLUMN source VARCHAR(32);
ALTER TABLE tasks ADD COLUMN closed_at DATE;
ALTER TABLE tasks ADD COLUMN lost_reason TEXT;

-- Migrate status to stage_id
UPDATE tasks SET stage_id = (SELECT id FROM stages WHERE name = 'Новый') WHERE status = 'NEW';
UPDATE tasks SET stage_id = (SELECT id FROM stages WHERE name = 'В работе') WHERE status = 'IN_PROGRESS';
UPDATE tasks SET stage_id = (SELECT id FROM stages WHERE name = 'На проверке') WHERE status = 'ON_REVIEW';
UPDATE tasks SET stage_id = (SELECT id FROM stages WHERE name = 'Успешно завершен') WHERE status = 'DONE';
UPDATE tasks SET stage_id = (SELECT id FROM stages WHERE name = 'Отменен') WHERE status = 'CANCELLED';

-- Fallback for any unmapped tasks
UPDATE tasks SET stage_id = (SELECT id FROM stages WHERE is_default = true) WHERE stage_id IS NULL;

-- Make stage_id not null and drop status
ALTER TABLE tasks ALTER COLUMN stage_id SET NOT NULL;
ALTER TABLE tasks DROP COLUMN status;
