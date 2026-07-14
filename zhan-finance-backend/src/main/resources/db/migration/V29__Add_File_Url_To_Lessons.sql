-- Add file_url to lessons table to support attaching separate document files alongside media/video

ALTER TABLE lessons
ADD COLUMN file_url VARCHAR(512);
