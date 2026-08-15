-- Adds the standard audit columns to service_credentials as part of
-- converting the Service Credentials domain to the BaseModel standard —
-- see src/models/BaseModel.ts and instruction.md. Already has updated_at.
USE hr_platform;

ALTER TABLE service_credentials
  ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER notes,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_service_credentials_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_service_credentials_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
