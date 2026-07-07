-- V17__Services_Schema.sql
-- Модуль услуг: таблица услуг + запросы на услуги

-- ========== ТАБЛИЦА УСЛУГ ==========
CREATE TABLE services (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    price           VARCHAR(100),
    image_url       VARCHAR(512),
    is_highlighted  BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Фичи услуг (что входит в услугу)
CREATE TABLE service_features (
    id          BIGSERIAL PRIMARY KEY,
    service_id  BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    feature     VARCHAR(255) NOT NULL
);

CREATE INDEX idx_service_features_service ON service_features(service_id);

-- ========== ЗАПРОСЫ НА УСЛУГИ ==========
CREATE TABLE service_requests (
    id              BIGSERIAL PRIMARY KEY,
    client_id       BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    service_id      BIGINT REFERENCES services(id) ON DELETE SET NULL,
    service_title   VARCHAR(255) NOT NULL,
    client_message  TEXT,
    preferred_contact_date DATE,
    status          VARCHAR(50) NOT NULL DEFAULT 'NEW',
    assigned_employee_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    linked_task_id  BIGINT UNIQUE REFERENCES tasks(id) ON DELETE SET NULL,
    error_message   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_service_requests_status CHECK (status IN ('NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'))
);

CREATE INDEX idx_service_requests_client ON service_requests(client_id);
CREATE INDEX idx_service_requests_client_status ON service_requests(client_id, status);
CREATE INDEX idx_service_requests_service ON service_requests(service_id);
CREATE INDEX idx_service_requests_employee ON service_requests(assigned_employee_id);

-- ========== SEED DATA: Moved to ServiceDatabaseSeeder.java ==========
