CREATE TABLE document_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    file_path   VARCHAR(500) NOT NULL,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE SEQUENCE doc_number_seq START 1000;

ALTER TABLE documents ADD COLUMN generated_from_template_id UUID REFERENCES document_templates(id);
