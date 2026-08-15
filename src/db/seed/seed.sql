-- =============================================================
--  HR Platform — Demo Seed Data
--  Run: mysql -u root -p hr_platform < src/db/seed/seed.sql   (after `npm run migrate`)
--  Reference date: 2026-06-21
--
--  Rewritten post-normalization (Phase 5 dropped role/department/designation/
--  salary/pay_frequency/timezone/work_hours/password_hash from `employees` —
--  see migrate_normalize_employees_p3.sql). Employees now insert across three
--  tables, same as Employee.js's create() does:
--    employees          — id, name, email, manager_id, start_date, tech_stack
--    employee_auth      — password_hash, role
--    employee_profile   — timezone, work_hours
--  designation/department are resolved to designation_id/department_id via
--  the departments/designations lookup tables instead of free text.
--
--  Also remapped leave_type from the retired casual/annual categories to the
--  current ones (sick/bereavement/maternity/paternity) — see
--  migrate_leave_policy.sql — since leave_balances no longer accepts the old
--  values at all, and leave_requests only keeps them for historical rows.
-- =============================================================

USE hr_platform;

-- ─────────────────────────────────────────────────────────────
-- 0. LOOKUP TABLES — departments / designations
--    Seeded first so employees can be resolved to their ids below.
-- ─────────────────────────────────────────────────────────────

INSERT IGNORE INTO departments (name) VALUES
  ('Engineering'), ('Design'), ('Product'), ('Operations');

INSERT IGNORE INTO designations (title, department_id) VALUES
  ('Engineering Lead',        (SELECT id FROM departments WHERE name = 'Engineering')),
  ('Senior Backend Engineer', (SELECT id FROM departments WHERE name = 'Engineering')),
  ('Frontend Engineer',       (SELECT id FROM departments WHERE name = 'Engineering')),
  ('Full Stack Engineer',     (SELECT id FROM departments WHERE name = 'Engineering')),
  ('DevOps Engineer',         (SELECT id FROM departments WHERE name = 'Engineering')),
  ('UI/UX Designer',          (SELECT id FROM departments WHERE name = 'Design')),
  ('Product Designer',        (SELECT id FROM departments WHERE name = 'Design')),
  ('Product Manager',         (SELECT id FROM departments WHERE name = 'Product')),
  ('HR Manager',              (SELECT id FROM departments WHERE name = 'Operations')),
  ('Operations Lead',         (SELECT id FROM departments WHERE name = 'Operations'));

-- ─────────────────────────────────────────────────────────────
-- 1. EMPLOYEES
--    password_hash = bcrypt("Demo@1234") for all demo accounts
--    Only Kshitiz (id=1) is updated — others are inserted fresh
-- ─────────────────────────────────────────────────────────────

-- Update Kshitiz (id=1, already exists) — core identity fields only.
UPDATE employees
SET designation_id = (SELECT id FROM designations WHERE title = 'Engineering Lead'),
    department_id  = (SELECT id FROM departments WHERE name = 'Engineering'),
    start_date     = '2023-01-15',
    tech_stack     = '["Node.js","React","MySQL","Docker"]'
WHERE id = 1;

INSERT INTO employee_auth (employee_id, password_hash, role) VALUES
  (1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'admin')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role           = VALUES(role);

INSERT INTO employee_profile (employee_id, timezone, work_hours) VALUES
  (1, 'Asia/Kathmandu', '9 AM - 6 PM')
ON DUPLICATE KEY UPDATE
  timezone   = VALUES(timezone),
  work_hours = VALUES(work_hours);

INSERT INTO employees
  (id, name, email, manager_id, start_date, tech_stack, designation_id, department_id, is_active)
VALUES
-- Engineering — Backend
(2,  'Priya Sharma',     'priya@bsrealtyllc.com',   1, '2023-03-01', '["Node.js","PostgreSQL","Redis","AWS"]',
 (SELECT id FROM designations WHERE title = 'Senior Backend Engineer'), (SELECT id FROM departments WHERE name = 'Engineering'), TRUE),

(3,  'Rohan Thapa',      'rohan@bsrealtyllc.com',   1, '2023-06-15', '["React","TypeScript","Next.js","Tailwind"]',
 (SELECT id FROM designations WHERE title = 'Frontend Engineer'), (SELECT id FROM departments WHERE name = 'Engineering'), TRUE),

(4,  'Ankit Joshi',      'ankit@bsrealtyllc.com',   1, '2023-09-01', '["React","Node.js","MongoDB","GraphQL"]',
 (SELECT id FROM designations WHERE title = 'Full Stack Engineer'), (SELECT id FROM departments WHERE name = 'Engineering'), TRUE),

(5,  'Sara Magar',       'sara@bsrealtyllc.com',    1, '2024-01-10', '["Docker","Kubernetes","CI/CD","Linux","AWS"]',
 (SELECT id FROM designations WHERE title = 'DevOps Engineer'), (SELECT id FROM departments WHERE name = 'Engineering'), TRUE),

-- Design
(6,  'Nisha Tamang',     'nisha@bsrealtyllc.com',   NULL, '2023-04-01', '["Figma","Adobe XD","Prototyping","Framer"]',
 (SELECT id FROM designations WHERE title = 'UI/UX Designer'), (SELECT id FROM departments WHERE name = 'Design'), TRUE),

(7,  'Bikash Rai',       'bikash@bsrealtyllc.com',  6, '2024-02-15', '["Figma","Illustrator","Motion Design"]',
 (SELECT id FROM designations WHERE title = 'Product Designer'), (SELECT id FROM departments WHERE name = 'Design'), TRUE),

-- Product
(8,  'Amit Karki',       'amit@bsrealtyllc.com',    NULL, '2023-02-01', '["Jira","Notion","Figma","SQL"]',
 (SELECT id FROM designations WHERE title = 'Product Manager'), (SELECT id FROM departments WHERE name = 'Product'), TRUE),

-- Operations
(9,  'Sunita Shrestha',  'sunita@bsrealtyllc.com',  NULL, '2022-11-01', '["HRMS","Payroll","Recruitment"]',
 (SELECT id FROM designations WHERE title = 'HR Manager'), (SELECT id FROM departments WHERE name = 'Operations'), TRUE),

(10, 'Dipesh Adhikari',  'dipesh@bsrealtyllc.com',  9, '2023-07-01', '["Excel","Process Mgmt","Vendor Relations"]',
 (SELECT id FROM designations WHERE title = 'Operations Lead'), (SELECT id FROM departments WHERE name = 'Operations'), TRUE)

ON DUPLICATE KEY UPDATE
  designation_id = VALUES(designation_id),
  department_id  = VALUES(department_id),
  is_active      = VALUES(is_active);

INSERT INTO employee_auth (employee_id, password_hash, role) VALUES
  (2,  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'lead'),
  (3,  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'employee'),
  (4,  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'employee'),
  (5,  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'employee'),
  (6,  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'lead'),
  (7,  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'employee'),
  (8,  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'lead'),
  (9,  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'admin'),
  (10, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', 'employee')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role           = VALUES(role);

INSERT INTO employee_profile (employee_id, timezone, work_hours) VALUES
  (2,  'Asia/Kathmandu', '9 AM - 6 PM'),
  (3,  'Asia/Kathmandu', '9 AM - 6 PM'),
  (4,  'Asia/Kathmandu', '9 AM - 6 PM'),
  (5,  'Asia/Kathmandu', '9 AM - 6 PM'),
  (6,  'Asia/Kathmandu', '10 AM - 7 PM'),
  (7,  'Asia/Kathmandu', '10 AM - 7 PM'),
  (8,  'Asia/Kathmandu', '9 AM - 6 PM'),
  (9,  'Asia/Kathmandu', '9 AM - 5 PM'),
  (10, 'Asia/Kathmandu', '9 AM - 5 PM')
ON DUPLICATE KEY UPDATE
  timezone   = VALUES(timezone),
  work_hours = VALUES(work_hours);

INSERT INTO employee_compensation_history (employee_id, salary, pay_frequency, effective_from, change_reason) VALUES
  (1,  4500.00, 'monthly', '2023-01-15', 'seed'),
  (2,  3800.00, 'monthly', '2023-03-01', 'seed'),
  (3,  2800.00, 'monthly', '2023-06-15', 'seed'),
  (4,  3000.00, 'monthly', '2023-09-01', 'seed'),
  (5,  3200.00, 'monthly', '2024-01-10', 'seed'),
  (6,  2900.00, 'monthly', '2023-04-01', 'seed'),
  (7,  2400.00, 'monthly', '2024-02-15', 'seed'),
  (8,  3500.00, 'monthly', '2023-02-01', 'seed'),
  (9,  3000.00, 'monthly', '2022-11-01', 'seed'),
  (10, 2600.00, 'monthly', '2023-07-01', 'seed')
ON DUPLICATE KEY UPDATE salary = VALUES(salary);


-- ─────────────────────────────────────────────────────────────
-- 2. LEAVE BALANCES  (year 2026)
--    leave_type remapped: casual -> sick, annual -> alternating
--    maternity/paternity so seeded data spans all four current categories.
-- ─────────────────────────────────────────────────────────────

INSERT INTO leave_balances (employee_id, leave_type, total, taken, year)
VALUES
-- Kshitiz
(1,'sick',12,2,2026),(1,'bereavement',3,0,2026),(1,'paternity',30,3,2026),
-- Priya
(2,'sick',12,3,2026),(2,'bereavement',3,0,2026),(2,'maternity',60,5,2026),
-- Rohan (currently on leave -> taken reflects it)
(3,'sick',12,1,2026),(3,'bereavement',3,0,2026),(3,'paternity',30,8,2026),
-- Ankit
(4,'sick',12,2,2026),(4,'bereavement',3,1,2026),(4,'paternity',30,2,2026),
-- Sara
(5,'sick',12,0,2026),(5,'bereavement',3,0,2026),(5,'maternity',60,0,2026),
-- Nisha (on sick leave today)
(6,'sick',12,3,2026),(6,'bereavement',3,0,2026),(6,'maternity',60,4,2026),
-- Bikash
(7,'sick',12,0,2026),(7,'bereavement',3,0,2026),(7,'paternity',30,2,2026),
-- Amit
(8,'sick',12,1,2026),(8,'bereavement',3,0,2026),(8,'paternity',30,1,2026),
-- Sunita
(9,'sick',12,0,2026),(9,'bereavement',3,0,2026),(9,'maternity',60,0,2026),
-- Dipesh
(10,'sick',12,2,2026),(10,'bereavement',3,1,2026),(10,'paternity',30,0,2026)

ON DUPLICATE KEY UPDATE
  total  = VALUES(total),
  taken  = VALUES(taken);


-- ─────────────────────────────────────────────────────────────
-- 3. LEAVE REQUESTS
--    Today = 2026-06-21
--    This week = 2026-06-21 through 2026-06-27
--    leave_type remapped from casual/annual to the current four categories.
-- ─────────────────────────────────────────────────────────────

INSERT INTO leave_requests
  (id, employee_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at)
VALUES
-- OUT TODAY: Rohan on leave June 19-24
(1,  3, 'paternity', '2026-06-19', '2026-06-24',
 'Family trip to Pokhara', 'approved', 1, '2026-06-10 10:00:00'),

-- OUT TODAY: Nisha on sick leave June 21
(2,  6, 'sick', '2026-06-21', '2026-06-21',
 'Fever and cold', 'approved', 9, '2026-06-21 08:30:00'),

-- OUT THIS WEEK: Bikash on leave June 23-25
(3,  7, 'paternity', '2026-06-23', '2026-06-25',
 'Personal work', 'approved', 9, '2026-06-15 14:00:00'),

-- PENDING: Priya wants July 1-5 off
(4,  2, 'maternity', '2026-07-01', '2026-07-05',
 'Vacation planned with family', 'pending', NULL, NULL),

-- PENDING: Ankit bereavement June 25
(5,  4, 'bereavement', '2026-06-25', '2026-06-25',
 'Personal errand', 'pending', NULL, NULL),

-- PENDING: Sara leave July 10-14
(6,  5, 'maternity', '2026-07-10', '2026-07-14',
 'Medical check-up trip to India', 'pending', NULL, NULL),

-- PENDING: Dipesh sick June 24
(7,  10, 'sick', '2026-06-24', '2026-06-24',
 'Doctor appointment', 'pending', NULL, NULL),

-- REJECTED: Amit June 15-16 (already past)
(8,  8, 'bereavement', '2026-06-15', '2026-06-16',
 'Personal work', 'rejected', 1, '2026-06-12 09:00:00'),

-- APPROVED past: Kshitiz May leave (historical)
(9,  1, 'paternity', '2026-05-20', '2026-05-22',
 'Conference in Kathmandu', 'approved', 9, '2026-05-10 11:00:00'),

-- APPROVED past: Priya April sick
(10, 2, 'sick', '2026-04-10', '2026-04-11',
 'Food poisoning', 'approved', 1, '2026-04-10 07:30:00'),

-- Historical approved leaves for trend data (March-May)
(11, 3, 'bereavement', '2026-05-05', '2026-05-05', 'Personal work', 'approved', 1, '2026-05-03 10:00:00'),
(12, 4, 'sick',        '2026-05-12', '2026-05-14', 'Flu',           'approved', 9, '2026-05-12 08:00:00'),
(13, 6, 'maternity',   '2026-04-20', '2026-04-24', 'Dashain break', 'approved', 1, '2026-04-10 10:00:00'),
(14, 7, 'bereavement', '2026-05-28', '2026-05-29', 'Home renovation','approved',9, '2026-05-20 09:00:00'),
(15, 5, 'sick',        '2026-03-18', '2026-03-18', 'Migraine',      'approved', 1, '2026-03-18 07:00:00'),
(16, 8, 'paternity',   '2026-06-02', '2026-06-02', 'Holiday',       'approved', 9, '2026-05-25 11:00:00'),
(17, 9, 'bereavement', '2026-06-10', '2026-06-10', 'Bank work',     'approved', 1, '2026-06-08 10:00:00'),
(18, 2, 'maternity',   '2026-06-16', '2026-06-17', 'Short break',   'approved', 1, '2026-06-08 14:00:00')

ON DUPLICATE KEY UPDATE status = VALUES(status);


-- ─────────────────────────────────────────────────────────────
-- 4. PROJECTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO projects (id, name, description, repo_url, status, start_date, expected_end_date)
VALUES
(1, 'HR Management Platform',
 'Internal HR system for managing employees, leaves, payroll, and standups.',
 'https://github.com/bsrealtyllc/hr-platform',
 'active', '2023-01-15', '2026-09-30'),

(2, 'Client Portal',
 'Self-service portal for clients to track project progress and manage requests.',
 'https://github.com/bsrealtyllc/client-portal',
 'active', '2024-03-01', '2026-08-15'),

(3, 'Mobile Companion App',
 'React Native app for employees to check schedules, submit standups, and request leaves on the go.',
 'https://github.com/bsrealtyllc/mobile-app',
 'on_hold', '2025-01-10', '2026-12-31'),

(4, 'Analytics Dashboard',
 'Business intelligence dashboard with real-time KPIs for leadership.',
 'https://github.com/bsrealtyllc/analytics',
 'active', '2026-04-01', '2026-10-31')

ON DUPLICATE KEY UPDATE name = VALUES(name);


-- ─────────────────────────────────────────────────────────────
-- 5. PROJECT ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO project_assignments (project_id, employee_id, role)
VALUES
-- HR Platform
(1, 1, 'tech lead'),
(1, 2, 'backend developer'),
(1, 3, 'frontend developer'),
(1, 4, 'full stack developer'),
(1, 5, 'devops'),
-- Client Portal
(2, 3, 'tech lead'),
(2, 6, 'ui/ux lead'),
(2, 7, 'designer'),
(2, 8, 'product manager'),
(2, 4, 'frontend developer'),
-- Mobile App
(3, 4, 'lead developer'),
(3, 7, 'ui designer'),
(3, 5, 'devops'),
-- Analytics Dashboard
(4, 1, 'architect'),
(4, 2, 'backend developer'),
(4, 8, 'product manager'),
(4, 6, 'ui/ux')

ON DUPLICATE KEY UPDATE role = VALUES(role);


-- ─────────────────────────────────────────────────────────────
-- 6. MILESTONES
-- ─────────────────────────────────────────────────────────────

INSERT INTO milestones (id, project_id, title, due_date, status)
VALUES
-- HR Platform
(1,  1, 'Authentication & role system',         '2023-03-31', 'completed'),
(2,  1, 'Employee & leave management',           '2023-07-31', 'completed'),
(3,  1, 'Payroll & reporting module',            '2023-12-31', 'completed'),
(4,  1, 'MCP server integration',               '2026-06-30', 'in_progress'),
(5,  1, 'Analytics & dashboard v2',             '2026-09-30', 'pending'),

-- Client Portal
(6,  2, 'UX research & wireframes',             '2024-04-30', 'completed'),
(7,  2, 'Design system & component library',    '2024-07-31', 'completed'),
(8,  2, 'Frontend — project tracker view',      '2026-07-15', 'in_progress'),
(9,  2, 'Backend API & client auth',            '2026-08-01', 'pending'),
(10, 2, 'Beta launch',                          '2026-08-15', 'pending'),

-- Mobile App
(11, 3, 'Technical feasibility & stack decision','2025-03-31','completed'),
(12, 3, 'UI/UX design — all screens',           '2026-08-31', 'pending'),
(13, 3, 'Core app development',                 '2026-11-30', 'pending'),

-- Analytics Dashboard
(14, 4, 'Data pipeline & schema',               '2026-05-31', 'completed'),
(15, 4, 'KPI widget library',                   '2026-07-31', 'in_progress'),
(16, 4, 'Executive view & exports',             '2026-09-30', 'pending')

ON DUPLICATE KEY UPDATE status = VALUES(status);


-- ─────────────────────────────────────────────────────────────
-- 7. STANDUPS
--    Today = 2026-06-21  |  Rohan & Nisha are on leave (skip)
--    Past 14 days for trend data
-- ─────────────────────────────────────────────────────────────

INSERT INTO standups (employee_id, yesterday, today, blockers, standup_date) VALUES

-- TODAY (2026-06-21) — 5 engineers submitted
(1, 'Reviewed MCP server auth flow, fixed token refresh edge case.',
    'Demo the MCP integration with Claude Desktop, merge to main.',
    NULL, '2026-06-21'),

(2, 'Optimized leave-trend query, reduced response time by 40%.',
    'Work on analytics dashboard data pipeline, review Ankit''s PR.',
    NULL, '2026-06-21'),

(4, 'Finished client portal frontend — project tracker view is live.',
    'Write unit tests for tracker component, fix Safari CSS issue.',
    'Safari flexbox bug on project card — investigating.', '2026-06-21'),

(5, 'Set up staging environment for client portal.',
    'Configure auto-deploy pipeline for HR platform staging branch.',
    NULL, '2026-06-21'),

(8, 'Groomed backlog for Analytics Dashboard Q3.',
    'Sync with design team on KPI widget specs, update Jira.',
    NULL, '2026-06-21'),

-- 2026-06-20 (Friday)
(1, 'Built MCP tool handlers for leave and standup domains.',
    'Test all 23 tools with MCP Inspector, write auth token manager.',
    NULL, '2026-06-20'),
(2, 'Deployed backend fixes to production, monitored logs.',
    'Optimize leave trend query, review PRs.',
    NULL, '2026-06-20'),
(3, 'Finished leave list UI, added status filter chips.',
    'Last PR review before vacation — then OOO.',
    NULL, '2026-06-20'),
(4, 'Completed tracker component frontend.',
    'Push PR, deploy to staging.',
    NULL, '2026-06-20'),
(6, 'Finalized KPI widget designs in Figma.',
    'Hand off to Bikash for asset export — then OOO.',
    NULL, '2026-06-20'),
(7, 'Exported design assets for analytics dashboard.',
    'Prepare files for handoff, then vacation prep.',
    NULL, '2026-06-20'),
(8, 'Reviewed client portal progress with frontend team.',
    'Write Q3 roadmap doc.',
    NULL, '2026-06-20'),

-- 2026-06-19 (Thursday)
(1, 'Wrote client.js and employees tool module for MCP.',
    'Continue with leaves and standups tools.',
    NULL, '2026-06-19'),
(2, 'Wrote unit tests for leave approval controller.',
    'Deploy and monitor. Review Rohan''s UI PR.',
    NULL, '2026-06-19'),
(3, 'Started leave list UI refactor.',
    'Finish filter chips, submit PR.',
    'Design spec unclear on mobile layout — asked Nisha.', '2026-06-19'),
(4, 'Finished GraphQL schema for client portal.',
    'Start frontend tracker component.',
    NULL, '2026-06-19'),
(5, 'Configured Docker Compose for local dev environment.',
    'Set up staging environment for client portal.',
    NULL, '2026-06-19'),
(6, 'Ran user testing session for dashboard designs.',
    'Incorporate feedback, finalize KPI widgets.',
    NULL, '2026-06-19'),
(8, 'Wrote Q2 retrospective notes.',
    'Plan Q3 backlog grooming session.',
    NULL, '2026-06-19'),

-- 2026-06-18 (Wednesday)
(1, 'Scaffolded MCP server directory, installed SDK.',
    'Write auth module and HTTP client wrapper.',
    NULL, '2026-06-18'),
(2, 'Fixed pagination bug in employees list endpoint.',
    'Write tests for leave approval, deploy hotfix.',
    NULL, '2026-06-18'),
(4, 'Designed GraphQL schema for client portal API.',
    'Implement resolvers and start frontend.',
    NULL, '2026-06-18'),
(5, 'Updated CI pipeline to run tests on PR.',
    'Configure Docker Compose for local dev.',
    NULL, '2026-06-18'),
(6, 'Created interactive prototype for dashboard in Figma.',
    'Run user testing session, collect feedback.',
    NULL, '2026-06-18'),
(7, 'Finished mobile app screen designs (12 screens).',
    'Final review with Nisha, then export assets.',
    NULL, '2026-06-18'),

-- 2026-06-17 (Tuesday)
(1, 'Planned MCP server architecture with Priya.',
    'Scaffold the mcp-server directory, install SDK.',
    NULL, '2026-06-17'),
(2, 'Reviewed MCP server plan, gave architecture feedback.',
    'Fix pagination bug in employees endpoint.',
    NULL, '2026-06-17'),
(3, 'Reviewed client portal design spec.',
    'Start leave list UI refactor.',
    NULL, '2026-06-17'),
(4, 'Fixed mobile app memory leak reported by QA.',
    'Design GraphQL schema for client portal.',
    NULL, '2026-06-17'),
(8, 'Finalized Q3 roadmap draft.',
    'Review with stakeholders, update Jira.',
    NULL, '2026-06-17'),

-- 2026-06-16 (Monday)
(1, 'Reviewed dashboard analytics data pipeline.',
    'Plan MCP server architecture.',
    NULL, '2026-06-16'),
(2, 'Deployed analytics pipeline v1 to production.',
    'Monitor performance, review PRs.',
    NULL, '2026-06-16'),
(5, 'Resolved disk space issue on prod server.',
    'Update CI pipeline.',
    'Disk alert at 85% — cleaned old Docker images.', '2026-06-16'),
(6, 'Kicked off analytics dashboard design sprint.',
    'Create interactive prototype in Figma.',
    NULL, '2026-06-16'),
(7, 'Reviewed mobile app screen designs with Nisha.',
    'Apply feedback, finalize all 12 screens.',
    NULL, '2026-06-16'),
(8, 'Sprint planning for Q3.',
    'Finalise roadmap draft.',
    NULL, '2026-06-16');


-- ─────────────────────────────────────────────────────────────
-- 8. CULTURE EVENTS (upcoming / recent)
-- ─────────────────────────────────────────────────────────────

INSERT INTO culture_events (title, event_type, employee_id, event_date, description)
VALUES
('Priya''s Work Anniversary',  'anniversary', 2, '2026-06-01',  '3 years at BSRealty!'),
('Ankit''s Birthday',          'birthday',    4, '2026-06-28',  'Team celebration planned'),
('Q2 Team Lunch',              'team_event',  NULL,'2026-06-27', 'End-of-quarter team lunch at local restaurant'),
('Nisha''s Work Anniversary',  'anniversary', 6, '2026-07-01',  '3 years in Design'),
('Amit''s Birthday',           'birthday',    8, '2026-07-15',  'Cake and celebration in office')

ON DUPLICATE KEY UPDATE title = VALUES(title);


-- ─────────────────────────────────────────────────────────────
--  VERIFY
-- ─────────────────────────────────────────────────────────────

SELECT 'Employees'     AS entity, COUNT(*) AS total FROM employees    WHERE is_active = TRUE;
SELECT 'Leave requests'AS entity, COUNT(*) AS total FROM leave_requests;
SELECT 'Standups'      AS entity, COUNT(*) AS total FROM standups;
SELECT 'Projects'      AS entity, COUNT(*) AS total FROM projects;
SELECT 'Milestones'    AS entity, COUNT(*) AS total FROM milestones;
SELECT 'Pending leaves'AS entity, COUNT(*) AS total FROM leave_requests WHERE status='pending';
SELECT 'Out today'     AS entity, COUNT(*) AS total FROM leave_requests
  WHERE status='approved' AND start_date <= '2026-06-21' AND end_date >= '2026-06-21';
SELECT 'Standups today'AS entity, COUNT(*) AS total FROM standups WHERE standup_date = '2026-06-21';
