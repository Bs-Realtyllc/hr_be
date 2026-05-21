-- Run this migration on your database to add auth and payroll fields
USE hr_platform;

ALTER TABLE employees
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER role,
  ADD COLUMN salary DECIMAL(10,2) NULL AFTER password_hash,
  ADD COLUMN pay_frequency ENUM('monthly','biweekly','weekly') DEFAULT 'monthly' AFTER salary;

-- ─────────────────────────────────────────────────────────────────────────────
-- After running this migration, set a password for your admin user:
--
-- Step 1 — generate a bcrypt hash on the server:
--   node -e "require('bcryptjs').hash('Admin@123',10).then(console.log)"
--
-- Step 2 — paste the hash into this query and run it:
--   UPDATE employees SET password_hash = '<hash>' WHERE role = 'admin' LIMIT 1;
-- ─────────────────────────────────────────────────────────────────────────────
