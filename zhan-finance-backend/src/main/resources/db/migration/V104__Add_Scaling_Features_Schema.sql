-- V104__Add_Scaling_Features_Schema.sql

CREATE TABLE user_labels (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    color VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_user_labels (
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id BIGINT NOT NULL REFERENCES user_labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

CREATE TABLE employee_services (
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, service_id)
);

ALTER TABLE stages ADD COLUMN sla_hours INT DEFAULT NULL;

ALTER TABLE app_users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE task_history ADD COLUMN from_stage_id BIGINT REFERENCES stages(id) ON DELETE SET NULL;
ALTER TABLE task_history ADD COLUMN to_stage_id BIGINT REFERENCES stages(id) ON DELETE SET NULL;
