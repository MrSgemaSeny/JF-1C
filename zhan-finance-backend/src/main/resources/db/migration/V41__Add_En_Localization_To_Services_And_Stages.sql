-- Add English localization columns to services
ALTER TABLE services ADD COLUMN title_en VARCHAR(255);
ALTER TABLE services ADD COLUMN description_en TEXT;

-- Add English localization columns to stages
ALTER TABLE stages ADD COLUMN name_en VARCHAR(255);
