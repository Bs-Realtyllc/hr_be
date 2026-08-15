-- Adds created_by/updated_by to email_settings as part of converting the
-- Email Settings domain to the BaseModel standard — see
-- src/models/BaseModel.ts and instruction.md. Already has created_at/updated_at.
USE hr_platform;

ALTER TABLE email_settings
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_email_settings_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_email_settings_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
