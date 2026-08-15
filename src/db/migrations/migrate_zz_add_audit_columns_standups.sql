-- Adds the standard audit columns to standups as part of converting the
-- Standups domain to the BaseModel standard — see src/models/BaseModel.ts
-- and instruction.md. standups already has created_at.
USE hr_platform;

ALTER TABLE standups
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_standups_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_standups_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
