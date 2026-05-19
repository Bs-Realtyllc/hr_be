-- Run this migration on your database to add auth and payroll fields
USE hr_platform;

-- Add auth and payroll columns to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER role,
  ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2) NULL AFTER password_hash,
  ADD COLUMN IF NOT EXISTS pay_frequency ENUM('monthly','biweekly','weekly') DEFAULT 'monthly' AFTER salary;

-- ─────────────────────────────────────────────────────────────────────────────
-- Initial admin setup
-- After running this migration, set a password for your admin user via:
--
--   curl -X PUT http://localhost:6002/api/payroll/<EMPLOYEE_ID>/reset-password \
--        -H "Content-Type: application/json" \
--        -d '{"password":"YourSecurePassword"}'
--
-- You will need to call this without auth by temporarily removing the
-- requireRole middleware, or use the bcrypt hash below:
--
-- To generate a hash manually:
--   node -e "const b=require('bcryptjs'); b.hash('Admin@123',10).then(console.log)"
--
-- Then run: UPDATE employees SET password_hash = '<hash>' WHERE role = 'admin' LIMIT 1;
-- ─────────────────────────────────────────────────────────────────────────────
