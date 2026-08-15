-- Phase 5 of the employees-table redesign: cleanup.
--
-- This is the only genuinely irreversible step in the redesign — every prior
-- phase was additive or read-only-affecting. By this point:
--   * every application read of these columns goes through `employees_flat`
--     (Employee.js and all 15 other model files that JOIN employee data were
--      repointed there in the same change that produced this migration);
--   * `employees_flat` itself pulls these values from employee_auth /
--     employee_profile / employee_compensation_history / employee_documents,
--     none of which depend on the legacy columns being dropped here;
--   * the columns being dropped have been fully populated on the new tables
--     since Phase 3's dual-write went live and verified via row-by-row diffs
--     in Phase 4.
--
-- Kept permanently on `employees` (NOT dropped):
--   id, name, email, secondary_email        -- core identity, never moved
--   manager_id, designation_id, department_id -- current-state pointers the
--                                                view reads directly, avoiding
--                                                a job_history join on every read
--   start_date, is_active, status, termination_date, termination_reason
--   tech_stack, qualifications              -- deliberately kept as JSON,
--                                                never normalized (see plan)
--   created_at
--
-- Dropped here (now live exclusively on the new tables):
--   phone, alt_phone, discord_username, emergency_contact, dob, bio, address
--     -> employee_profile
--   profile_picture, citizenship_front, citizenship_back
--     -> employee_documents
--   designation, department (free-text)
--     -> designations/departments, referenced via designation_id/department_id
--   role, password_hash
--     -> employee_auth
--   salary, pay_frequency
--     -> employee_compensation_history
--   timezone, work_hours
--     -> employee_profile
--   leave_policy_accepted, leave_policy_accepted_at
--     -> employee_profile
--
-- IMPORTANT: run only after a burn-in period on Phase 4 with production
-- traffic and monitoring, per the migration plan. Recommended: re-run the
-- `grep -rn "FROM employees \|JOIN employees "` sweep from the plan's Phase 5
-- verification note immediately before applying this, to catch any new code
-- written during the burn-in period that reintroduced a raw `employees` read
-- of a soon-to-be-dropped column.

USE hr_platform;

ALTER TABLE employees
  DROP COLUMN phone,
  DROP COLUMN alt_phone,
  DROP COLUMN discord_username,
  DROP COLUMN emergency_contact,
  DROP COLUMN dob,
  DROP COLUMN bio,
  DROP COLUMN address,
  DROP COLUMN profile_picture,
  DROP COLUMN citizenship_front,
  DROP COLUMN citizenship_back,
  DROP COLUMN designation,
  DROP COLUMN department,
  DROP COLUMN role,
  DROP COLUMN password_hash,
  DROP COLUMN salary,
  DROP COLUMN pay_frequency,
  DROP COLUMN timezone,
  DROP COLUMN work_hours,
  DROP COLUMN leave_policy_accepted,
  DROP COLUMN leave_policy_accepted_at;
