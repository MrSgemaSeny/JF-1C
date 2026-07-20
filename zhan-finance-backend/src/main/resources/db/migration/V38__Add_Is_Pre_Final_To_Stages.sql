ALTER TABLE stages ADD COLUMN is_pre_final BOOLEAN DEFAULT FALSE;
UPDATE stages SET is_pre_final = TRUE WHERE name = 'На проверке';
