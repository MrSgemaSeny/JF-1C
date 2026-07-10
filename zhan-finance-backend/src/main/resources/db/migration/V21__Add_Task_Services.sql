-- V21__Add_Task_Services.sql
-- Создание связующей таблицы для привязки услуг к задачам

CREATE TABLE task_services (
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, service_id)
);

CREATE INDEX idx_task_services_task_id ON task_services(task_id);
CREATE INDEX idx_task_services_service_id ON task_services(service_id);
