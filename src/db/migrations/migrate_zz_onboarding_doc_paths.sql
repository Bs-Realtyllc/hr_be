-- Add document path columns to employee_onboarding_profile if they are missing.
-- Each column is a separate statement so ER_DUP_FIELDNAME on one does not
-- block the others — the migrator skips that error code automatically.

USE hr_platform;

ALTER TABLE employee_onboarding_profile ADD COLUMN nda_path VARCHAR(255) NULL;
ALTER TABLE employee_onboarding_profile ADD COLUMN citizenship_front_path VARCHAR(255) NULL;
ALTER TABLE employee_onboarding_profile ADD COLUMN citizenship_back_path VARCHAR(255) NULL;
ALTER TABLE employee_onboarding_profile ADD COLUMN pan_path VARCHAR(255) NULL;
ALTER TABLE employee_onboarding_profile ADD COLUMN passout_certificate_path VARCHAR(255) NULL;
ALTER TABLE employee_onboarding_profile ADD COLUMN photo_path VARCHAR(255) NULL;
