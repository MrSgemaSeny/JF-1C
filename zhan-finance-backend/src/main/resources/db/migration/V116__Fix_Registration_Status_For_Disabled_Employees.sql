UPDATE app_users 
SET registration_status = 'PENDING' 
WHERE enabled = false AND role IN ('EMPLOYEE', 'CURATOR', 'ADVISOR');
