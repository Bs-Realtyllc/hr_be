-- Bug fix found while converting the Standups domain (see instruction.md):
-- Standup.upsert() (now standup.repository.ts's upsert) has always used
-- `ON DUPLICATE KEY UPDATE`, and swagger.js documents "submitting again for
-- the same day overwrites the previous entry" — but no UNIQUE constraint on
-- (employee_id, standup_date) has ever existed, so there was nothing for
-- MySQL to treat as a duplicate. Every resubmission for the same day silently
-- INSERTed a new row instead of overwriting the existing one.
--
-- NOTE: this ALTER fails with a duplicate-key error (harmlessly skipped by
-- migrate.js — see SKIPPABLE_CODES) if this database already has more than
-- one standup row for the same (employee_id, standup_date) from the bug
-- above. If that happens, dedupe those rows first (keep the latest
-- `created_at` per pair) before this constraint can apply.
USE hr_platform;

ALTER TABLE standups
  ADD UNIQUE KEY unique_employee_standup_date (employee_id, standup_date);
