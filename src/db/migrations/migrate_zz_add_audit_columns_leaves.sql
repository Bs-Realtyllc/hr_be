-- Adds the standard audit columns (updated_at, created_by, updated_by) to
-- leave_requests as part of converting the Leaves domain to the BaseModel
-- standard — see src/models/BaseModel.ts and instruction.md.
--
-- leave_balances is deliberately NOT given these — it's a system-maintained
-- running counter (seeded on employee creation, incremented on leave
-- approval), never directly created/edited by a user action, same rationale
-- as the append-only history tables skipping BaseModel (see instruction.md).
--
-- `zz_` prefix: migrate.js applies migrate_*.sql files in plain alphabetical
-- order; leave_requests has existed since schema.sql, so this has no real
-- ordering dependency, but the prefix is kept for consistency with the other
-- audit-column migrations.
USE hr_platform;

ALTER TABLE leave_requests
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN created_by INT NULL AFTER updated_at,
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD CONSTRAINT fk_leave_requests_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_leave_requests_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
