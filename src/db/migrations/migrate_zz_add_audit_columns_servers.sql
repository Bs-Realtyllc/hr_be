-- Adds the standard audit columns to servers as part of converting the
-- Servers domain to the BaseModel standard — see src/models/BaseModel.ts
-- and instruction.md. servers already has created_at.
USE hr_platform;

ALTER TABLE servers
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_servers_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_servers_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
