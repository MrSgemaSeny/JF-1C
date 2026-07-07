CREATE TABLE IF NOT EXISTS stored_files (
    id VARCHAR(64) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(255),
    data BYTEA NOT NULL
);
