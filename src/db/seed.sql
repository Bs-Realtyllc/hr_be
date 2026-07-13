-- =============================================================
--  HR Platform — Demo Seed Data
--  Run: mariadb -u root -pkshitizgajurel hr_platform < seed.sql
--  Reference date: 2026-06-21
-- =============================================================

USE hr_platform;

-- ─────────────────────────────────────────────────────────────
-- 1. EMPLOYEES
--    password_hash = bcrypt("Demo@1234") for all demo accounts
--    Only Kshitiz (id=1) is updated — others are inserted fresh
-- ─────────────────────────────────────────────────────────────

-- Update Kshitiz (id=1, already exists) to admin + lead
UPDATE employees
SET role        = 'admin',
    department  = 'Engineering',
    designation = 'Engineering Lead',
    salary      = 4500.00,
    start_date  = '2023-01-15',
    tech_stack  = '["Node.js","React","MySQL","Docker"]',
    timezone    = 'Asia/Kathmandu',
    work_hours  = '9 AM - 6 PM'
WHERE id = 1;

INSERT INTO employees
  (id, name, email, phone, designation, department, manager_id, role,
   salary, pay_frequency, start_date, timezone, work_hours, tech_stack,
   password_hash, is_active)
VALUES
-- Engineering — Backend
(2,  'Priya Sharma',     'priya@bsrealtyllc.com',   '+977-9841000002', 'Senior Backend Engineer', 'Engineering', 1, 'lead',
 3800.00, 'monthly', '2023-03-01', 'Asia/Kathmandu', '9 AM - 6 PM', '["Node.js","PostgreSQL","Redis","AWS"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE),

(3,  'Rohan Thapa',      'rohan@bsrealtyllc.com',   '+977-9841000003', 'Frontend Engineer',       'Engineering', 1, 'employee',
 2800.00, 'monthly', '2023-06-15', 'Asia/Kathmandu', '9 AM - 6 PM', '["React","TypeScript","Next.js","Tailwind"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE),

(4,  'Ankit Joshi',      'ankit@bsrealtyllc.com',   '+977-9841000004', 'Full Stack Engineer',     'Engineering', 1, 'employee',
 3000.00, 'monthly', '2023-09-01', 'Asia/Kathmandu', '9 AM - 6 PM', '["React","Node.js","MongoDB","GraphQL"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE),

(5,  'Sara Magar',       'sara@bsrealtyllc.com',    '+977-9841000005', 'DevOps Engineer',         'Engineering', 1, 'employee',
 3200.00, 'monthly', '2024-01-10', 'Asia/Kathmandu', '9 AM - 6 PM', '["Docker","Kubernetes","CI/CD","Linux","AWS"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE),

-- Design
(6,  'Nisha Tamang',     'nisha@bsrealtyllc.com',   '+977-9841000006', 'UI/UX Designer',          'Design',      NULL, 'lead',
 2900.00, 'monthly', '2023-04-01', 'Asia/Kathmandu', '10 AM - 7 PM', '["Figma","Adobe XD","Prototyping","Framer"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE),

(7,  'Bikash Rai',       'bikash@bsrealtyllc.com',  '+977-9841000007', 'Product Designer',        'Design',      6, 'employee',
 2400.00, 'monthly', '2024-02-15', 'Asia/Kathmandu', '10 AM - 7 PM', '["Figma","Illustrator","Motion Design"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE),

-- Product
(8,  'Amit Karki',       'amit@bsrealtyllc.com',    '+977-9841000008', 'Product Manager',         'Product',     NULL, 'lead',
 3500.00, 'monthly', '2023-02-01', 'Asia/Kathmandu', '9 AM - 6 PM', '["Jira","Notion","Figma","SQL"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE),

-- Operations
(9,  'Sunita Shrestha',  'sunita@bsrealtyllc.com',  '+977-9841000009', 'HR Manager',              'Operations',  NULL, 'admin',
 3000.00, 'monthly', '2022-11-01', 'Asia/Kathmandu', '9 AM - 5 PM', '["HRMS","Payroll","Recruitment"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE),

(10, 'Dipesh Adhikari',  'dipesh@bsrealtyllc.com',  '+977-9841000010', 'Operations Lead',         'Operations',  9, 'employee',
 2600.00, 'monthly', '2023-07-01', 'Asia/Kathmandu', '9 AM - 5 PM', '["Excel","Process Mgmt","Vendor Relations"]',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSC5L.B4e', TRUE)

ON DUPLICATE KEY UPDATE
  designation = VALUES(designation),
  department  = VALUES(department),
  salary      = VALUES(salary),
  is_active   = VALUES(is_active);


-- ─────────────────────────────────────────────────────────────
-- 2. LEAVE BALANCES  (year 2026)
-- ─────────────────────────────────────────────────────────────

INSERT INTO leave_balances (employee_id, leave_type, total, taken, year)
VALUES
-- Kshitiz
(1,'casual',12,2,2026),(1,'sick',12,1,2026),(1,'annual',15,3,2026),
-- Priya
(2,'casual',12,3,2026),(2,'sick',12,2,2026),(2,'annual',15,5,2026),
-- Rohan (currently on annual leave → taken reflects it)
(3,'casual',12,1,2026),(3,'sick',12,0,2026),(3,'annual',15,8,2026),
-- Ankit
(4,'casual',12,2,2026),(4,'sick',12,3,2026),(4,'annual',15,2,2026),
-- Sara
(5,'casual',12,0,2026),(5,'sick',12,1,2026),(5,'annual',15,0,2026),
-- Nisha (on sick leave today)
(6,'casual',12,1,2026),(6,'sick',12,3,2026),(6,'annual',15,4,2026),
-- Bikash
(7,'casual',12,0,2026),(7,'sick',12,0,2026),(7,'annual',15,2,2026),
-- Amit
(8,'casual',12,1,2026),(8,'sick',12,0,2026),(8,'annual',15,1,2026),
-- Sunita
(9,'casual',12,0,2026),(9,'sick',12,0,2026),(9,'annual',15,0,2026),
-- Dipesh
(10,'casual',12,1,2026),(10,'sick',12,2,2026),(10,'annual',15,0,2026)

ON DUPLICATE KEY UPDATE
  total  = VALUES(total),
  taken  = VALUES(taken);


-- ─────────────────────────────────────────────────────────────
-- 3. LEAVE REQUESTS
--    Today = 2026-06-21
--    This week = 2026-06-21 through 2026-06-27
-- ─────────────────────────────────────────────────────────────

INSERT INTO leave_requests
  (id, employee_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at)
VALUES
-- OUT TODAY: Rohan on annual leave June 19-24
(1,  3, 'annual', '2026-06-19', '2026-06-24',
 'Family trip to Pokhara', 'approved', 1, '2026-06-10 10:00:00'),

-- OUT TODAY: Nisha on sick leave June 21
(2,  6, 'sick', '2026-06-21', '2026-06-21',
 'Fever and cold', 'approved', 9, '2026-06-21 08:30:00'),

-- OUT THIS WEEK: Bikash on annual leave June 23-25
(3,  7, 'annual', '2026-06-23', '2026-06-25',
 'Personal work', 'approved', 9, '2026-06-15 14:00:00'),

-- PENDING: Priya wants July 1-5 off
(4,  2, 'annual', '2026-07-01', '2026-07-05',
 'Vacation planned with family', 'pending', NULL, NULL),

-- PENDING: Ankit casual June 25
(5,  4, 'casual', '2026-06-25', '2026-06-25',
 'Personal errand', 'pending', NULL, NULL),

-- PENDING: Sara annual July 10-14
(6,  5, 'annual', '2026-07-10', '2026-07-14',
 'Medical check-up trip to India', 'pending', NULL, NULL),

-- PENDING: Dipesh sick June 24
(7,  10, 'sick', '2026-06-24', '2026-06-24',
 'Doctor appointment', 'pending', NULL, NULL),

-- REJECTED: Amit June 15-16 (already past)
(8,  8, 'casual', '2026-06-15', '2026-06-16',
 'Personal work', 'rejected', 1, '2026-06-12 09:00:00'),

-- APPROVED past: Kshitiz May leave (historical)
(9,  1, 'annual', '2026-05-20', '2026-05-22',
 'Conference in Kathmandu', 'approved', 9, '2026-05-10 11:00:00'),

-- APPROVED past: Priya April sick
(10, 2, 'sick', '2026-04-10', '2026-04-11',
 'Food poisoning', 'approved', 1, '2026-04-10 07:30:00'),

-- Historical approved leaves for trend data (March-May)
(11, 3, 'casual', '2026-05-05', '2026-05-05', 'Personal work', 'approved', 1, '2026-05-03 10:00:00'),
(12, 4, 'sick',   '2026-05-12', '2026-05-14', 'Flu',           'approved', 9, '2026-05-12 08:00:00'),
(13, 6, 'annual', '2026-04-20', '2026-04-24', 'Dashain break', 'approved', 1, '2026-04-10 10:00:00'),
(14, 7, 'casual', '2026-05-28', '2026-05-29', 'Home renovation','approved',9, '2026-05-20 09:00:00'),
(15, 5, 'sick',   '2026-03-18', '2026-03-18', 'Migraine',      'approved', 1, '2026-03-18 07:00:00'),
(16, 8, 'annual', '2026-06-02', '2026-06-02', 'Holiday',       'approved', 9, '2026-05-25 11:00:00'),
(17, 9, 'casual', '2026-06-10', '2026-06-10', 'Bank work',     'approved', 1, '2026-06-08 10:00:00'),
(18, 2, 'annual', '2026-06-16', '2026-06-17', 'Short break',   'approved', 1, '2026-06-08 14:00:00')

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
