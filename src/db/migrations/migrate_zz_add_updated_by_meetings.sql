-- meetings already has id/created_at/updated_at/created_by (the organizer —
-- doubles as the BaseModel "who created this row" audit field, no separate
-- column needed); just adding updated_by for symmetry (tracks who cancelled
-- it, the only mutation this domain has).
USE hr_platform;

ALTER TABLE meetings
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_meetings_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
