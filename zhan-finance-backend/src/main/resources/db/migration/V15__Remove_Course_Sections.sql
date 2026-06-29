ALTER TABLE lessons ADD COLUMN course_id BIGINT;

UPDATE lessons
SET course_id = (SELECT course_id FROM course_sections WHERE course_sections.id = lessons.section_id);

ALTER TABLE lessons ALTER COLUMN course_id SET NOT NULL;
ALTER TABLE lessons ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_section_id_fkey;
ALTER TABLE lessons DROP COLUMN section_id;

DROP TABLE course_sections;
