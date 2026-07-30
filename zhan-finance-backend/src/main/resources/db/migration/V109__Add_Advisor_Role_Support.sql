-- Migration V109: Add ADVISOR role support and performance indexes
COMMENT ON COLUMN app_users.role IS 'User roles: ADMIN, EMPLOYEE, CLIENT, LEARNER, CURATOR, ADVISOR';

CREATE INDEX IF NOT EXISTS idx_users_role ON app_users(role);
