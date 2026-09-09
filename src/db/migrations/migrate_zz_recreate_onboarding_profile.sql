-- The `employee_onboarding_profile` table on disk was still the pre-consolidation
-- per-employee education extension (PK `employee_id`, FK -> employees), because the
-- CREATE TABLE IF NOT EXISTS in migrate_zz_consolidate_employee_tables.sql silently
-- no-op'd against it. The application (Drizzle model + onboard repository/controller)
-- has always targeted the redesigned standalone candidate-intake table described in
-- that migration (own `id`, name/email/gender/role, document paths, no employee_id).
-- The 13 rows on the old table were dev/seed fixtures with no name/email/gender captured
-- and several roles (admin/lead) that don't fit the new role enum, so they are dropped
-- rather than backfilled (confirmed with the team before running this).
USE hr_platform;

DROP TABLE IF EXISTS employee_onboarding_profile;

CREATE TABLE employee_onboarding_profile (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  gender ENUM ('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
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
  previous_experience TEXT NULL,
  areas_of_interest TEXT NULL,
  linkedin_url VARCHAR(255) NULL,
  github_url VARCHAR(255) NULL,
  portfolio_url VARCHAR(255) NULL,
  role ENUM ('intern', 'employee') NOT NULL,
  additional_info TEXT NULL,
  tech_stack JSON,
  nda_path VARCHAR(255) NULL,
  citizenship_front_path VARCHAR(255) NULL,
  citizenship_back_path VARCHAR(255) NULL,
  pan_path VARCHAR(255) NULL,
  passout_certificate_path VARCHAR(255) NULL,
  photo_path VARCHAR(255) NULL
);
