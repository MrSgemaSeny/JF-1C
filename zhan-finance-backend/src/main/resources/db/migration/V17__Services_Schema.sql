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

-- ========== SEED DATA: 6 услуг ==========
INSERT INTO services (title, description, price, is_highlighted, is_active) VALUES
('Бухгалтерское сопровождение', 'Полный учёт операций, составление отчётности, контроль финансов.', '', true, true),
('Сдача налоговой отчетности', 'Своевременная подготовка и сдача всех обязательных форм в налоговую.', '', true, true),
('Кадровый учет и расчет зарплаты', 'Ведение кадровых документов, табелей, расчет отпускных и больничных.', '', true, true),
('Восстановление бухгалтерского учета', 'Приведём в порядок документы, исправим ошибки и пересдадим отчётность.', '', false, true),
('Обработка первичной документации', 'Работа с актами, накладными, счетами и внутренней бухгалтерией.', '', false, true),
('Проверка и анализ контрагентов', 'Юридическая проверка надежности партнеров и клиентов до сделки.', '', false, true);

-- Фичи для каждой услуги
INSERT INTO service_features (service_id, feature) VALUES
-- 1. Бухгалтерское сопровождение
(1, 'Полный учет операций'),
(1, 'Составление отчетности'),
(1, 'Контроль финансов'),
-- 2. Сдача налоговой отчетности
(2, 'Подготовка и сдача отчетности'),
(2, 'Консультации по налогам'),
(2, 'Работа с налоговыми органами'),
-- 3. Кадровый учет
(3, 'Кадровые документы'),
(3, 'Расчёт зарплаты'),
(3, 'Табели и отпускные'),
-- 4. Восстановление учета
(4, 'Анализ прошлых периодов'),
(4, 'Восстановление документов'),
(4, 'Пересдача отчетности'),
-- 5. Обработка первички
(5, 'Обработка актов и накладных'),
(5, 'Ввод первички'),
(5, 'Сверки с контрагентами'),
-- 6. Проверка контрагентов
(6, 'Проверка контрагентов'),
(6, 'Анализ рисков'),
(6, 'Рекомендации по сотрудничеству');
