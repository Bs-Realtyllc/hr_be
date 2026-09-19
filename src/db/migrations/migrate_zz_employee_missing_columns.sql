-- Add columns to employees that exist in the Drizzle model but were never
-- migrated to production: gender, github_url, panNo.
-- gender/github_url were planned for employee_profile but the model
-- instead keeps them on employees directly; panNo had no migration at all.

USE hr_platform;

ALTER TABLE employees
  ADD COLUMN gender ENUM('male','female','other','prefer_not_to_say') NULL AFTER name;

ALTER TABLE employees
  ADD COLUMN github_url VARCHAR(255) NULL AFTER address;

ALTER TABLE employees
  ADD COLUMN panNo VARCHAR(50) NULL UNIQUE AFTER discord_username;
