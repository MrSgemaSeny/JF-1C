-- Create trigger function to block any UPDATE, DELETE, or TRUNCATE operations
CREATE OR REPLACE FUNCTION block_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log records are immutable and cannot be updated, deleted, or truncated.';
END;
$$ LANGUAGE plpgsql;

-- Trigger to protect against UPDATE and DELETE
CREATE TRIGGER trg_protect_audit_logs_row
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION block_audit_modification();

-- Trigger to protect against TRUNCATE
CREATE TRIGGER trg_protect_audit_logs_stmt
BEFORE TRUNCATE ON audit_logs
FOR EACH STATEMENT
EXECUTE FUNCTION block_audit_modification();
