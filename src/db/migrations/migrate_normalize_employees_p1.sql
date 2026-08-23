-- Phase 1 of the employees-table redesign (additive only — nothing reads/writes
-- these tables yet, so this migration changes zero application behavior).
--
-- Target shape (see plan for full rationale):
--   employees                     -- core identity + current-state pointers (slimmed later)
--   employee_auth                 -- 1:1, security boundary: password_hash, role
--   employee_profile              -- 1:1, self-service PII
--   departments / designations    -- lookup tables, replacing free-text columns
--   employee_job_history          -- effective-dated: designation/department/manager over time
--   employee_compensation_history -- effective-dated: salary/pay_frequency over time
--   employee_documents            -- versioned file metadata (profile picture, citizenship docs)
--   schema_migrations             -- minimal migration-tracking table (see migrate.js)

USE hr_platform;

-- ── Migration tracking ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename     VARCHAR(255) PRIMARY KEY,
  applied_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed it with every migration file that predates this tracking table, so
-- migrate.js's future skip-logic doesn't need to re-evaluate them.
INSERT IGNORE INTO schema_migrations (filename) VALUES
  ('migrate_assignment_role.sql'),
  ('migrate_auth.sql'),
  ('migrate_discord_username.sql'),
  ('migrate_email_settings.sql'),
  ('migrate_google_calendar.sql'),
  ('migrate_holiday_message.sql'),
  ('migrate_leave_policy.sql'),
  ('migrate_leave_policy_ack.sql'),
  ('migrate_monthly_reports.sql'),
  ('migrate_overtime_payroll.sql'),
  ('migrate_policies.sql'),
  ('migrate_policy_category.sql'),
  ('migrate_policy_pin.sql'),
  ('migrate_profile.sql'),
  ('migrate_project_services.sql'),
  ('migrate_secondary_email.sql'),
  ('migrate_weekly_reports.sql');

-- ── Lookup tables ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL UNIQUE,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designations (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  title          VARCHAR(100) NOT NULL UNIQUE,
  department_id  INT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ── Auth / profile split (1:1 with employees) ───────────────────────────────
CREATE TABLE IF NOT EXISTS employee_auth (
  employee_id    INT PRIMARY KEY,
  password_hash  VARCHAR(255) NULL,
  role           ENUM('admin', 'lead', 'employee') NOT NULL DEFAULT 'employee',
  last_login_at  TIMESTAMP NULL,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_profile (
  employee_id                INT PRIMARY KEY,
  phone                      VARCHAR(20) NULL,
  alt_phone                  VARCHAR(20) NULL,
  discord_username           VARCHAR(100) NULL UNIQUE,
  emergency_contact          VARCHAR(150) NULL,
  dob                        DATE NULL,
  bio                        TEXT NULL,
  address                    TEXT NULL,
  timezone                   VARCHAR(50) DEFAULT 'UTC',
  work_hours                 VARCHAR(50) DEFAULT '9 AM - 5 PM',
  leave_policy_accepted      BOOLEAN DEFAULT FALSE,
  leave_policy_accepted_at   TIMESTAMP NULL,
  updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ── Effective-dated history (append-only audit trail) ───────────────────────
CREATE TABLE IF NOT EXISTS employee_job_history (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  employee_id     INT NOT NULL,
  designation_id  INT NULL,
  department_id   INT NULL,
  manager_id      INT NULL,
  effective_from  DATE NOT NULL,
  effective_to    DATE NULL,        -- NULL = current row
  change_reason   VARCHAR(255) NULL,
  changed_by      INT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_employee_job_history_employee (employee_id, effective_from),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS employee_compensation_history (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  employee_id     INT NOT NULL,
  salary          DECIMAL(10,2) NOT NULL,
  pay_frequency   ENUM('monthly','biweekly','weekly') NOT NULL DEFAULT 'monthly',
  effective_from  DATE NOT NULL,
  effective_to    DATE NULL,
  change_reason   VARCHAR(255) NULL,
  changed_by      INT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_employee_comp_history_employee (employee_id, effective_from),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- ── Document metadata (replaces bare filename columns) ──────────────────────
CREATE TABLE IF NOT EXISTS employee_documents (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  employee_id   INT NOT NULL,
  doc_type      ENUM('profile_picture', 'citizenship_front', 'citizenship_back') NOT NULL,
  filename      VARCHAR(255) NOT NULL,
  uploaded_by   INT NULL,
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_current    BOOLEAN DEFAULT TRUE,
  KEY idx_employee_documents_current (employee_id, doc_type, is_current),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- ── New columns on employees (nullable, additive — no default disruption) ──
-- status/termination_* expand the current is_active boolean into a real lifecycle;
-- is_active is kept as-is (not dropped) so every existing `WHERE is_active = TRUE`
-- query keeps working unmodified. designation_id/department_id will become the
-- "current snapshot" pointers once Phase 3/4 wire up the lookup tables.
ALTER TABLE employees
  -- ADD COLUMN status ENUM('onboarding','active','on_leave','probation','terminated') NOT NULL DEFAULT 'active' AFTER is_active,
  ADD COLUMN termination_date DATE NULL AFTER status,
  ADD COLUMN termination_reason VARCHAR(255) NULL AFTER termination_date,
  ADD COLUMN designation_id INT NULL AFTER designation,
  ADD COLUMN department_id INT NULL AFTER department,
  ADD CONSTRAINT fk_employees_designation FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Backfill status from the existing is_active boolean so the two stay consistent
-- from the moment the column exists (every current row is either active or
-- already-deactivated — deactivate() only ever sets is_active=FALSE today).
UPDATE employees SET status = 'terminated' WHERE is_active = FALSE AND status = 'active';
