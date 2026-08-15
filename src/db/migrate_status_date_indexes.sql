-- Index gap fix (step 2): `status` columns used for "pending approvals" style
-- dashboards, plus date columns driving ORDER BY / range filters, that were
-- never given a supporting index.
--
-- Composite (status, employee_id) rather than a solo `status` index: `status`
-- alone is low-selectivity (2-3 enum values), but every read of it in the
-- model layer is either "all pending across everyone" (leading column covers
-- that) or "this employee's pending/approved requests" (both columns cover
-- that) — one index serves both instead of paying for two.

USE hr_platform;

-- leave_requests: Dashboard.js pending-leave count, LeaveRequest.js per-employee
-- lookups, and the approved-range overlap check run on every new leave
-- submission (`status = 'approved' AND start_date <= ? AND end_date >= ?`).
ALTER TABLE leave_requests
  ADD INDEX idx_leave_requests_status_employee (status, employee_id),
  ADD INDEX idx_leave_requests_status_dates (status, start_date, end_date);

-- overtime_requests: Dashboard.js pending-overtime count + OvertimeRequest.js
-- per-employee/status listing.
ALTER TABLE overtime_requests
  ADD INDEX idx_overtime_requests_status_employee (status, employee_id);

-- policy_acknowledgements: admin review queue filters by status; per-employee
-- lookups already covered by the existing unique_policy_employee key, so this
-- only needs to add the status angle.
ALTER TABLE policy_acknowledgements
  ADD INDEX idx_policy_ack_status (status);

-- projects / milestones: "active projects" dashboard count, milestone boards
-- filtered/grouped by status.
ALTER TABLE projects
  ADD INDEX idx_projects_status (status);
ALTER TABLE milestones
  ADD INDEX idx_milestones_status (status);

-- performance_reviews: per-employee status filter (submitted/acknowledged) in
-- PerformanceReview.js's review-cycle lookups.
ALTER TABLE performance_reviews
  ADD INDEX idx_performance_reviews_status_employee (status, employee_id);

-- Date columns used in ORDER BY / range scans with no supporting index today.
ALTER TABLE standups
  ADD INDEX idx_standups_date (standup_date);
ALTER TABLE culture_events
  ADD INDEX idx_culture_events_date (event_date);
ALTER TABLE overtime_requests
  ADD INDEX idx_overtime_requests_work_date (work_date);
