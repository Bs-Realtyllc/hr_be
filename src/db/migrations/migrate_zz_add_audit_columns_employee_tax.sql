-- Adds the standard audit columns to employee_tax_profiles as part of
-- converting the Payroll domain to the BaseModel standard — see
-- src/models/BaseModel.ts and instruction.md. employee_tax_profiles already
-- has updated_at; needs created_at + created_by/updated_by.
--
-- payroll_adjustments is deliberately NOT given these — it's an append-only
-- ledger (never updated after insert), same rationale as the history tables
-- (employee_job_history, employee_compensation_history) skipping BaseModel.
USE hr_platform;

ALTER TABLE employee_tax_profiles
  ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER notes,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_employee_tax_profiles_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_employee_tax_profiles_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
