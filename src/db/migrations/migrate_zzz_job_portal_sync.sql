-- Supports the job-portal "candidate hired" webhook: it creates a draft onboarding
-- profile with only the fields the job portal actually collects, so HR staff aren't
-- re-typing name/contact/links that already exist there.
--
-- gender has no equivalent on the job-portal side, so it can no longer be NOT NULL —
-- draft rows leave it empty until someone completes the profile in HR.


ALTER TABLE employee_onboarding_profile MODIFY COLUMN gender ENUM('male','female','other','prefer_not_to_say') NULL;

ALTER TABLE employee_onboarding_profile ADD COLUMN designation VARCHAR(100) NULL;
ALTER TABLE employee_onboarding_profile ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'manual';
ALTER TABLE employee_onboarding_profile ADD COLUMN source_application_id VARCHAR(100) NULL;

ALTER TABLE employee_onboarding_profile ADD UNIQUE KEY uq_onboarding_source_application (source_application_id);
ALTER TABLE employee_onboarding_profile ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;


-- latitiude and longitude in employee clock in

ALTER TABLE employee_daily_clock
  ADD COLUMN clock_in_lat DECIMAL(9,6) NULL AFTER clock_date,
  ADD COLUMN clock_in_lng DECIMAL(9,6) NULL AFTER clock_in_lat;