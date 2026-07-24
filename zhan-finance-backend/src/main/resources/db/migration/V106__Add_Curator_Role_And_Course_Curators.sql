-- Add CURATOR role check update if needed, and create course_curators table
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('ADMIN', 'EMPLOYEE', 'CLIENT', 'LEARNER', 'CURATOR'));

CREATE TABLE IF NOT EXISTS course_curators (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    curator_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    assigned_by BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_course_curator UNIQUE (course_id, curator_id)
);

CREATE INDEX IF NOT EXISTS idx_course_curators_curator_id ON course_curators(curator_id);
CREATE INDEX IF NOT EXISTS idx_course_curators_course_id ON course_curators(course_id);
