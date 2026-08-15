-- Index gap fix (step 1 of N): `employees.is_active` / `employees.status`.
--
-- Almost every model filters on `is_active` (dashboard counts, active-employee
-- lists, payroll queries, tax profiles, goals, leave balances, etc.) via
-- `WHERE e.is_active = TRUE` / `WHERE is_active = TRUE`. No index has ever
-- backed this column, so every one of those reads is a full table scan.
-- `status` gets the same treatment since it was introduced in the normalize-
-- employees redesign (migrate_normalize_employees_p1.sql) as the superset
-- lifecycle field is_active is being kept in sync with, and is starting to
-- show up in the same kind of filter (e.g. onboarding/on_leave/probation
-- views as they're built out).
--
-- Composite (is_active, status) rather than two single-column indexes: the
-- overwhelmingly common query is `is_active = TRUE` alone, and MySQL can still
-- use the leading column of this composite for that — a second lookup on
-- `status` alone isn't a real access pattern yet, so one index covers both
-- without paying for a second index's write overhead.

USE hr_platform;

ALTER TABLE employees
  ADD INDEX idx_employees_active_status (is_active, status);
