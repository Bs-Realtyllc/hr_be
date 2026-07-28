-- Tracks each employee's one-time acknowledgement of the leave & holiday policy.
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS leave_policy_accepted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS leave_policy_accepted_at TIMESTAMP NULL;
