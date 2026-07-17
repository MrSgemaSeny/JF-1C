-- The 'status' column is no longer mapped in the Task entity (replaced by Stage/Pipeline).
-- Make it nullable so inserts without status don't fail.
ALTER TABLE tasks ALTER COLUMN status DROP NOT NULL;
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'NEW';
