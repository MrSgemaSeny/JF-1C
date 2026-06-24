-- V6__Documents_Schema.sql
CREATE TABLE documents (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,              -- чей документ (клиент)
    uploaded_by BIGINT NOT NULL,              -- кто загрузил (клиент сам или сотрудник)
    file_name   VARCHAR(255) NOT NULL,        -- оригинальное имя файла
    storage_key VARCHAR(512) NOT NULL UNIQUE, -- путь/ключ в хранилище
    content_type VARCHAR(100) NOT NULL,       -- application/pdf, etc.
    file_size   BIGINT NOT NULL,              -- в байтах
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_documents_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_documents_user ON documents(user_id);
