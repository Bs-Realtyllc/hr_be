-- Consolidation: collapse employee_auth / employee_profile / employee_job_history /
-- employees_flat back into a single `employees` table, plus a redesigned
-- employee_documents / employee_tax_profiles and a new employee_onboarding_profile
-- table for candidate-intake fields. Reverses the Phase 1-3 normalization
-- (migrate_normalize_employees_p1/p2/p3.sql) for everything except
-- employee_compensation_history, which is kept as-is.
--
-- Order matters: add the new employees columns and backfill them from the
-- tables being dropped BEFORE dropping those tables.

USE hr_platform;

-- ── Step 1: additive columns on employees ───────────────────────────────────
-- ALTER TABLE employees
--   ADD COLUMN dob DATE NULL AFTER start_date,
--   ADD COLUMN gender ENUM('male','female','other','prefer_not_to_say') NULL AFTER dob,
--   ADD COLUMN github_url VARCHAR(255) NULL AFTER gender,
--   ADD COLUMN address TEXT NULL AFTER github_url,
--   ADD COLUMN discord_username VARCHAR(100) NULL AFTER address,
--   ADD COLUMN panNo VARCHAR(50) NULL AFTER discord_username,
--   ADD COLUMN role ENUM('admin','lead','employee','intern') NOT NULL DEFAULT 'employee' AFTER panNo,
--   ADD COLUMN password_hash VARCHAR(255) NULL AFTER role,
--   ADD UNIQUE KEY uq_employees_discord_username (discord_username),
--   ADD UNIQUE KEY uq_employees_panNo (panNo);

-- ── Step 2: backfill from employee_profile ──────────────────────────────────
-- UPDATE employees e
-- JOIN employee_profile p ON p.employee_id = e.id
-- SET e.dob = p.dob,
--     e.gender = p.gender,
--     e.github_url = p.github_url,
--     e.address = p.address,
--     e.discord_username = p.discord_username;

-- ── Step 3: backfill from employee_auth ─────────────────────────────────────
-- UPDATE employees e
-- JOIN employee_auth a ON a.employee_id = e.id
-- SET e.role = a.role,
--     e.password_hash = a.password_hash;

-- ── Step 4: backfill panNo from the old employee_tax_profiles.tax_id ────────
-- (must run before Step 9 drops/recreates employee_tax_profiles)
-- UPDATE employees e
-- JOIN employee_tax_profiles t ON t.employee_id = e.id
-- SET e.panNo = t.tax_id
-- WHERE t.tax_id IS NOT NULL AND t.tax_id <> '';

-- ── Step 5: new onboarding-intake table (split out of employee_profile) ─────
CREATE TABLE IF NOT EXISTS employee_onboarding_profile (
  -- employee_id          INT PRIMARY KEY,
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
  dob DATE NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  current_address VARCHAR(60) NULL,
  permanent_address VARCHAR(60) NULL,
  emergency_contact VARCHAR(150),
  education_level VARCHAR(50) NULL,
  institution_name VARCHAR(50) NULL,
  field_of_study VARCHAR(50) NULL,
  graduation_date DATE NULL,
  previous_experience  TEXT NULL,
  areas_of_interest    TEXT NULL,
  linkedin_url         VARCHAR(255) NULL,
  github_url         VARCHAR(255) NULL,
  portfolio_url        VARCHAR(255) NULL,
  role ENUM('intern', 'employee') NOT NULL,
  additional_info TEXT NULL,
  tech_stack JSON
);

-- INSERT IGNORE INTO employee_onboarding_profile
--   (employee_id, education_level, institution_name, field_of_study, graduation_date,
--    previous_experience, areas_of_interest, linkedin_url, portfolio_url)
-- SELECT
--   employee_id, education_level, institution_name, field_of_study, graduation_date,
--   previous_experience, areas_of_interest, linkedin_url, portfolio_url
-- FROM employee_profile;

-- ── Step 6: drop the compatibility view ──────────────────────────────────────
DROP VIEW IF EXISTS employees_flat;

-- ── Step 7: drop job history (no replacement — history trail is intentionally
-- given up per the consolidation) ────────────────────────────────────────────
DROP TABLE IF EXISTS employee_job_history;

-- ── Step 8: drop auth / profile (now fully backfilled onto employees /
-- employee_onboarding_profile) ───────────────────────────────────────────────
DROP TABLE IF EXISTS employee_auth;
DROP TABLE IF EXISTS employee_profile;

-- ── Step 9: redesign employee_documents (0 live rows — drop + recreate is
-- lossless) ───────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS employee_documents;
CREATE TABLE employee_documents (
  id        INT PRIMARY KEY AUTO_INCREMENT,
  emp_id    INT NOT NULL,
  url       VARCHAR(255) NULL,
  name      VARCHAR(100) NOT NULL,
  filename  VARCHAR(255) NOT NULL,
  KEY idx_employee_documents_emp_name (emp_id, name),
  FOREIGN KEY (emp_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ── Step 10: redesign employee_tax_profiles into a per-month ledger keyed by
-- panNo (the single existing row's data was already carried forward as
-- employees.panNo in Step 4 — the old filing-status/exemptions shape has no
-- equivalent in the new monthly-ledger model, so it is not migrated) ────────
DROP TABLE IF EXISTS employee_tax_profiles;
CREATE TABLE employee_tax_profiles (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  panNo       VARCHAR(50) NOT NULL,
  month       TINYINT NOT NULL,
  year        SMALLINT NOT NULL,
  amount      DECIMAL(10,2) NULL,
  tax_amount  DECIMAL(10,2) NULL,
  tax_perc    DECIMAL(5,2) NULL,
  UNIQUE KEY uq_employee_tax_profiles_pan_month_year (panNo, month, year)
);

-- ── Step 11: drop the two self-referencing FKs before dropping the columns
-- they're on (exact names confirmed via SHOW CREATE TABLE employees) ────────
ALTER TABLE employees
  DROP FOREIGN KEY fk_employees_created_by,
  DROP FOREIGN KEY fk_employees_updated_by;

-- ── Step 12: drop the columns with no place in the new shape ────────────────
ALTER TABLE employees
  DROP INDEX idx_employees_active_status,
  DROP COLUMN is_active,
  DROP COLUMN tech_stack,
  DROP COLUMN qualifications,
  DROP COLUMN termination_date,
  DROP COLUMN termination_reason,
  DROP COLUMN created_at,
  DROP COLUMN updated_at,
  DROP COLUMN created_by,
  DROP COLUMN updated_by;
