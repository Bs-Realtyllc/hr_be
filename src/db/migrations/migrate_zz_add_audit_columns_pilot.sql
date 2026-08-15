-- Adds the standard audit columns (updated_at, created_by, updated_by) to the
-- tables backing the newly-Sequelize-converted Employee/Auth domain — the
-- first tables migrated to the BaseModel standard (id, created_at, updated_at,
-- created_by, updated_by). See src/models/BaseModel.ts. Remaining domains
-- pick up the same treatment as each is converted in a later pass.
--
-- Named `zz_` (not `add_audit_columns_pilot`, alphabetically much earlier) so
-- migrate.js's plain filename sort runs it strictly after every migration it
-- depends on: employee_auth/employee_profile don't exist until
-- migrate_normalize_employees_p1.sql, and password_reset_tokens doesn't exist
-- until migrate_profile.sql — both sort after "n"/"p" but before "zz".
USE hr_platform;

-- employees already has created_at; needs the other three.
ALTER TABLE employees
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_employees_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_employees_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;

-- employee_auth already has updated_at; needs created_at + created_by/updated_by.
ALTER TABLE employee_auth
  ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER last_login_at,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_employee_auth_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_employee_auth_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;

-- employee_profile already has updated_at; needs created_at + created_by/updated_by.
ALTER TABLE employee_profile
  ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER leave_policy_accepted_at,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_employee_profile_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_employee_profile_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;

-- password_reset_tokens already has created_at; needs the other three.
ALTER TABLE password_reset_tokens
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_password_reset_tokens_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_password_reset_tokens_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
