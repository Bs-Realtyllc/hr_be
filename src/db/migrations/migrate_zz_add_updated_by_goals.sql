-- goals already has id/created_at/updated_at/created_by (the goal's own
-- "created by" column, already serving BaseModel's role — no separate
-- column needed); just adding updated_by for symmetry (tracks who last
-- edited or progressed the goal).
USE hr_platform;

ALTER TABLE goals
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_goals_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
