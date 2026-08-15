-- Adds the standard audit columns to `projects` (the primary resource in this
-- domain) as part of converting Projects to the BaseModel standard — see
-- src/models/BaseModel.ts and instruction.md. `projects` already has created_at.
--
-- milestones/project_assignments/project_services are sub-resources/join
-- tables (no natural "creator" beyond their own project_id/employee_id +
-- assigned_at) and deliberately skip BaseModel, same as other lookup/join
-- tables in this app (departments, designations).
USE hr_platform;

ALTER TABLE projects
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_projects_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
