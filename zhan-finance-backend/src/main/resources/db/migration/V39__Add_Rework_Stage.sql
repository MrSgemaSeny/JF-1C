-- Update existing stages order_index to make room for "Доработка" at index 5
UPDATE stages SET order_index = order_index + 1 WHERE order_index >= 5;

-- Insert "Доработка" stage at index 5 for default pipeline
INSERT INTO stages (id, created_at, updated_at, color, is_default, is_pre_final, name, order_index, type, pipeline_id)
SELECT 
    nextval('stages_seq'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'var(--color-stage-rework)',
    false,
    false,
    'Доработка',
    5,
    'OPEN',
    id
FROM pipelines WHERE is_default = true;
