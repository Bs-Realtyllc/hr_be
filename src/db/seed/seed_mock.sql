-- =============================================================
--  HR Platform — Rara Labs Mock Seed Data
--  Run: mariadb -u root -p hr_mock < src/db/seed/seed_mock.sql
--
--  Team:
--    Founders (admin): Bal Khadka (CEO), Madhu Sudan Neupane (CFO),
--                      Dilip Khawas (CMO/HR), RamChandra Thapa (CTO)
--    Employees:        Kshitiz Gajurel, Rama Bhattarai, Prayash Jung Khadka,
--                      Archana Acharya, Riya Sunar
--    Interns:          Rajat Pradhan, Nirdeshika Chauhan, Prem Kathayat,
--                      Apekshya Poudel, Jasmine Sharma
--
--  Passwords: <FirstName>@123  (e.g. Kshitiz@123)
--  Reference date: 2026-10-02
-- =============================================================

USE hr_mock;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE standups;
TRUNCATE TABLE leave_requests;
TRUNCATE TABLE leave_balances;
TRUNCATE TABLE project_assignments;
TRUNCATE TABLE milestones;
TRUNCATE TABLE project_todos;
TRUNCATE TABLE projects;
TRUNCATE TABLE culture_events;
TRUNCATE TABLE feedback_notes;
TRUNCATE TABLE goals;
TRUNCATE TABLE performance_reviews;
TRUNCATE TABLE payroll_adjustments;
TRUNCATE TABLE employee_compensation_history;
TRUNCATE TABLE employee_tax_profiles;
TRUNCATE TABLE employee_documents;
TRUNCATE TABLE overtime_requests;
TRUNCATE TABLE policies;
TRUNCATE TABLE policy_acknowledgements;
TRUNCATE TABLE meetings;
TRUNCATE TABLE weekly_reports;
TRUNCATE TABLE monthly_reports;
TRUNCATE TABLE service_credentials;
TRUNCATE TABLE servers;
TRUNCATE TABLE project_services;
TRUNCATE TABLE email_settings;
TRUNCATE TABLE employees;
TRUNCATE TABLE designations;
TRUNCATE TABLE departments;
SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────
-- 0. DEPARTMENTS & DESIGNATIONS
-- ─────────────────────────────────────────────────────────────

INSERT INTO departments (id, name) VALUES
  (1, 'Management'),
  (2, 'Engineering'),
  (3, 'Design'),
  (4, 'Operations');

INSERT INTO designations (id, title, department_id) VALUES
  (1,  'Chief Executive Officer',    1),
  (2,  'Chief Financial Officer',    1),
  (3,  'Chief Marketing Officer',    1),
  (4,  'Chief Technology Officer',   1),
  (5,  'Project Engineer',           2),
  (6,  'Frontend Engineer',          2),
  (7,  'Backend Engineer',           2),
  (8,  'Mobile App Developer',       2),
  (9,  'UI/UX Designer',             3),
  (10, 'Full Stack Intern',          2),
  (11, 'Mobile App Intern',          2),
  (12, 'Frontend Intern',            2),
  (13, 'UI/UX Intern',               3);

-- ─────────────────────────────────────────────────────────────
-- 1. EMPLOYEES
--    IDs 1-4: Founders (admin)
--    IDs 5-9: Employees
--    IDs 10-14: Interns
-- ─────────────────────────────────────────────────────────────

INSERT INTO employees
  (id, name, email, designation_id, department_id, manager_id,
   start_date, dob, gender, github_url, address, discord_username,
   panNo, role, password_hash, status, leave_policy_accepted, leave_policy_accepted_at)
VALUES

-- ── Founders ──────────────────────────────────────────────────
(1,  'Bal Khadka',
     'bal@raralabs.com',
     1, 1, NULL,
     '2019-01-15', '1980-05-12', 'male',
     'https://github.com/balkhadka',
     'Lazimpat, Kathmandu, Nepal',
     'bal_khadka',
     'PAN-100001',
     'admin',
     '$2a$10$leD4KirCIfNKmfr5Dzf9x.aUkIEzFg0l0tigN/ASQT6miHTDguvs.',
     'active', 1, '2019-01-15 09:00:00'),

(2,  'Madhu Sudan Neupane',
     'madhu@raralabs.com',
     2, 1, NULL,
     '2019-01-15', '1982-09-23', 'male',
     'https://github.com/madhusneupane',
     'Baluwatar, Kathmandu, Nepal',
     'madhu_neupane',
     'PAN-100002',
     'admin',
     '$2a$10$wfaCoAR2brvQ3DT2ELUC8e2eenrfpwV1nI58ns23y.R21rTmYt0mO',
     'active', 1, '2019-01-15 09:00:00'),

(3,  'Dilip Khawas',
     'dilip@raralabs.com',
     3, 4, NULL,
     '2019-03-01', '1983-03-07', 'male',
     'https://github.com/dilipkhawas',
     'Koteshwor, Kathmandu, Nepal',
     'dilip_khawas',
     'PAN-100003',
     'admin',
     '$2a$10$nXR87NlLs6aMybKxBYVDcOg5mYw3tvSOkMaSdXf0/Dwjf.AHrBhU2',
     'active', 1, '2019-03-01 09:00:00'),

(4,  'RamChandra Thapa',
     'ramchandra@raralabs.com',
     4, 2, NULL,
     '2019-02-01', '1981-11-18', 'male',
     'https://github.com/ramchandrathapa',
     'Patan, Lalitpur, Nepal',
     'ramchandra_thapa',
     'PAN-100004',
     'admin',
     '$2a$10$kJc1K92LZjEOlOiQzQweCOfvB5IrX0Ge4IjQo64S4LSsxpVOECTbu',
     'active', 1, '2019-02-01 09:00:00'),

-- ── Employees ─────────────────────────────────────────────────
(5,  'Kshitiz Gajurel',
     'kshitiz@raralabs.com',
     5, 2, 4,
     '2022-07-01', '1999-04-15', 'male',
     'https://github.com/kshitizgajurel',
     'Baneshwor, Kathmandu, Nepal',
     'kshitiz_gajurel',
     'PAN-200005',
     'lead',
     '$2a$10$XeM8fru35yAMF.yRcATG0.wSi9XsxNe.C9058/iE.I8u91lvfaAwO',
     'active', 1, '2022-07-01 09:00:00'),

(6,  'Rama Bhattarai',
     'rama@raralabs.com',
     6, 2, 5,
     '2023-02-01', '2000-08-22', 'female',
     'https://github.com/ramabhattarai',
     'Kalanki, Kathmandu, Nepal',
     'rama_bhattarai',
     'PAN-200006',
     'employee',
     '$2a$10$92Nq/eH10fPKual1DOrxduUMKBZJXbocpi.2WlQ531cKa4u629P5S',
     'active', 1, '2023-02-01 09:00:00'),

(7,  'Prayash Jung Khadka',
     'prayash@raralabs.com',
     7, 2, 5,
     '2023-04-15', '1999-12-05', 'male',
     'https://github.com/prayashjkhadka',
     'Imadol, Lalitpur, Nepal',
     'prayash_khadka',
     'PAN-200007',
     'employee',
     '$2a$10$DzWSrp/qD3zZqQtWkIuuvuv4/bndfACS2oJXIV2Iu/yHLpz5zRRci',
     'active', 1, '2023-04-15 09:00:00'),

(8,  'Archana Acharya',
     'archana@raralabs.com',
     8, 2, 5,
     '2023-06-01', '2001-03-11', 'female',
     'https://github.com/archana-acharya',
     'Satdobato, Lalitpur, Nepal',
     'archana_acharya',
     'PAN-200008',
     'employee',
     '$2a$10$HIkErLtZpvnJEW0mP/c1k.eOBTIyAYcgiAvbfaTXZA78U63Mayht2',
     'active', 1, '2023-06-01 09:00:00'),

(9,  'Riya Sunar',
     'riya@raralabs.com',
     9, 3, 5,
     '2023-08-15', '2001-06-27', 'female',
     'https://github.com/riyasunar',
     'Kupondole, Lalitpur, Nepal',
     'riya_sunar',
     'PAN-200009',
     'employee',
     '$2a$10$1VPxF3bbYcomfEn03rJYou3FEmh536NVlyRuULERZtbMxInpytAJC',
     'active', 1, '2023-08-15 09:00:00'),

-- ── Interns ───────────────────────────────────────────────────
(10, 'Rajat Pradhan',
     'rajat@raralabs.com',
     10, 2, 5,
     '2026-07-01', '2002-02-14', 'male',
     'https://github.com/rajatpradhan',
     'Maharajgunj, Kathmandu, Nepal',
     'rajat_pradhan',
     'PAN-300010',
     'intern',
     '$2a$10$27CFBLfX4.ZNm16EeAEn3O6yjYx.5TMh35t55m9WO2znqlS7Ze1vS',
     'active', 1, '2026-07-01 09:00:00'),

(11, 'Nirdeshika Chauhan',
     'nirdeshika@raralabs.com',
     11, 2, 8,
     '2026-07-01', '2002-09-30', 'female',
     'https://github.com/nirdeshikachauhan',
     'Boudha, Kathmandu, Nepal',
     'nirdeshika_chauhan',
     'PAN-300011',
     'intern',
     '$2a$10$NHPJHUBaQzc7GDXnOJ5jC.fmOcM4urDu4OWDmBnVc28pBHGbGQU6u',
     'active', 1, '2026-07-01 09:00:00'),

(12, 'Prem Kathayat',
     'prem@raralabs.com',
     12, 2, 6,
     '2026-07-01', '2003-01-08', 'male',
     'https://github.com/premkathayat',
     'Chabahil, Kathmandu, Nepal',
     'prem_kathayat',
     'PAN-300012',
     'intern',
     '$2a$10$qFnHScpU/LTl2B4Wbe/M3OspNrLdbGLxNIyWRpRFsoE0lO4kwAZoe',
     'active', 1, '2026-07-01 09:00:00'),

(13, 'Apekshya Poudel',
     'apekshya@raralabs.com',
     13, 3, 9,
     '2026-07-01', '2002-11-19', 'female',
     'https://github.com/apekshyapoudel',
     'Sanepa, Lalitpur, Nepal',
     'apekshya_poudel',
     'PAN-300013',
     'intern',
     '$2a$10$.7oYNMk3xO1xHfocI0YCKeaEO6qCh8t2vr8WTv8V1f6V3UZCzKvbC',
     'active', 1, '2026-07-01 09:00:00'),

(14, 'Jasmine Sharma',
     'jasmine@raralabs.com',
     13, 3, 9,
     '2026-07-01', '2003-04-25', 'female',
     'https://github.com/jasminesharma',
     'Sinamangal, Kathmandu, Nepal',
     'jasmine_sharma',
     'PAN-300014',
     'intern',
     '$2a$10$MdikuDUlSVVKmLQeiW3KDuSCMLv0AoIVs3H2X8ddlFFn4sJ2F1wYu',
     'active', 1, '2026-07-01 09:00:00');

-- ─────────────────────────────────────────────────────────────
-- 2. COMPENSATION HISTORY (NPR-equivalent, stored as monthly USD)
--    Founders: higher bands | Employees: mid | Interns: stipend
-- ─────────────────────────────────────────────────────────────

INSERT INTO employee_compensation_history (employee_id, salary, pay_frequency, effective_from, change_reason) VALUES
-- Founders
(1,  3000.00, 'monthly', '2019-01-15', 'initial'),
(2,  2800.00, 'monthly', '2019-01-15', 'initial'),
(3,  2600.00, 'monthly', '2019-03-01', 'initial'),
(4,  2900.00, 'monthly', '2019-02-01', 'initial'),
-- Employees
(5,  1200.00, 'monthly', '2022-07-01', 'initial'),
(5,  1500.00, 'monthly', '2024-01-01', 'annual_raise'),
(6,   900.00, 'monthly', '2023-02-01', 'initial'),
(6,  1050.00, 'monthly', '2024-03-01', 'performance_raise'),
(7,   950.00, 'monthly', '2023-04-15', 'initial'),
(7,  1100.00, 'monthly', '2024-05-01', 'performance_raise'),
(8,   900.00, 'monthly', '2023-06-01', 'initial'),
(8,  1050.00, 'monthly', '2024-07-01', 'annual_raise'),
(9,   850.00, 'monthly', '2023-08-15', 'initial'),
(9,   980.00, 'monthly', '2024-09-01', 'annual_raise'),
-- Interns (monthly stipend)
(10,  300.00, 'monthly', '2026-07-01', 'initial'),
(11,  300.00, 'monthly', '2026-07-01', 'initial'),
(12,  300.00, 'monthly', '2026-07-01', 'initial'),
(13,  300.00, 'monthly', '2026-07-01', 'initial'),
(14,  300.00, 'monthly', '2026-07-01', 'initial');

-- ─────────────────────────────────────────────────────────────
-- 3. LEAVE BALANCES (year 2026)
-- ─────────────────────────────────────────────────────────────

INSERT INTO leave_balances (employee_id, leave_type, total, taken, year) VALUES
-- Bal Khadka
(1,'sick',12,1,2026),(1,'bereavement',3,0,2026),(1,'paternity',30,0,2026),
-- Madhu Sudan Neupane
(2,'sick',12,0,2026),(2,'bereavement',3,0,2026),(2,'paternity',30,2,2026),
-- Dilip Khawas
(3,'sick',12,1,2026),(3,'bereavement',3,0,2026),(3,'paternity',30,0,2026),
-- RamChandra Thapa
(4,'sick',12,2,2026),(4,'bereavement',3,0,2026),(4,'paternity',30,1,2026),
-- Kshitiz Gajurel
(5,'sick',12,1,2026),(5,'bereavement',3,0,2026),(5,'paternity',30,3,2026),
-- Rama Bhattarai
(6,'sick',12,2,2026),(6,'bereavement',3,0,2026),(6,'maternity',60,0,2026),
-- Prayash Jung Khadka
(7,'sick',12,1,2026),(7,'bereavement',3,0,2026),(7,'paternity',30,2,2026),
-- Archana Acharya
(8,'sick',12,0,2026),(8,'bereavement',3,0,2026),(8,'maternity',60,1,2026),
-- Riya Sunar
(9,'sick',12,3,2026),(9,'bereavement',3,0,2026),(9,'maternity',60,0,2026),
-- Interns get fewer leaves
(10,'sick',6,0,2026),(10,'bereavement',1,0,2026),
(11,'sick',6,1,2026),(11,'bereavement',1,0,2026),
(12,'sick',6,0,2026),(12,'bereavement',1,0,2026),
(13,'sick',6,0,2026),(13,'bereavement',1,0,2026),
(14,'sick',6,1,2026),(14,'bereavement',1,0,2026)

ON DUPLICATE KEY UPDATE total = VALUES(total), taken = VALUES(taken);

-- ─────────────────────────────────────────────────────────────
-- 4. LEAVE REQUESTS
--    Reference date: 2026-10-02
-- ─────────────────────────────────────────────────────────────

INSERT INTO leave_requests
  (id, employee_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at)
VALUES
-- Approved - historical
(1,  5, 'paternity',   '2026-08-18', '2026-08-20', 'Family event in Pokhara',         'approved', 4, '2026-08-10 10:00:00'),
(2,  6, 'sick',        '2026-09-03', '2026-09-03', 'Fever and headache',               'approved', 5, '2026-09-03 08:30:00'),
(3,  7, 'sick',        '2026-09-15', '2026-09-16', 'Stomach infection',                'approved', 5, '2026-09-15 08:00:00'),
(4,  8, 'maternity',   '2026-09-22', '2026-09-22', 'Medical appointment',              'approved', 5, '2026-09-20 09:00:00'),
(5,  9, 'sick',        '2026-07-10', '2026-07-12', 'Flu and body ache',                'approved', 5, '2026-07-10 07:30:00'),
(6,  9, 'sick',        '2026-08-28', '2026-08-29', 'Eye infection',                    'approved', 5, '2026-08-27 16:00:00'),
(7,  4, 'paternity',   '2026-09-05', '2026-09-05', 'School event for child',           'approved', 1, '2026-09-03 11:00:00'),
(8,  1, 'sick',        '2026-06-12', '2026-06-12', 'Migraine',                         'approved', 2, '2026-06-12 07:00:00'),
(9,  14,'sick',        '2026-09-29', '2026-09-29', 'Cold and fever',                   'approved', 9, '2026-09-29 08:00:00'),

-- Pending
(10, 6, 'maternity',   '2026-10-08', '2026-10-10', 'Scheduled family function',        'pending',  NULL, NULL),
(11, 7, 'paternity',   '2026-10-14', '2026-10-15', 'Personal work',                    'pending',  NULL, NULL),
(12, 10,'sick',        '2026-10-07', '2026-10-07', 'Not feeling well',                 'pending',  NULL, NULL),
(13, 12,'sick',        '2026-10-09', '2026-10-09', 'Doctor visit',                     'pending',  NULL, NULL),

-- Rejected
(14, 5, 'paternity',   '2026-09-27', '2026-09-29', 'Personal trip during sprint end',  'rejected', 4, '2026-09-20 14:00:00')

ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ─────────────────────────────────────────────────────────────
-- 5. PROJECTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO projects (id, name, description, repo_url, status, start_date, expected_end_date)
VALUES
(1, 'HR Management Platform',
 'Internal HR system for managing employees, leaves, payroll, standups, and performance reviews.',
 'https://github.com/raralabs/hr-management-platform',
 'active', '2022-07-01', '2026-12-31'),

(2, 'Rara Delivery App',
 'Mobile-first delivery platform for logistics and last-mile delivery in Nepal.',
 'https://github.com/raralabs/rara-delivery-app',
 'active', '2024-01-10', '2026-11-30'),

(3, 'Client Analytics Dashboard',
 'Real-time business intelligence dashboard with KPIs, funnel analysis, and exportable reports for clients.',
 'https://github.com/raralabs/client-analytics-dashboard',
 'active', '2025-06-01', '2026-10-31'),

(4, 'Rara Admin Portal',
 'Internal admin portal for managing clients, subscriptions, billing, and platform health monitoring.',
 'https://github.com/raralabs/rara-admin-portal',
 'on_hold', '2025-03-01', '2027-03-31')

ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ─────────────────────────────────────────────────────────────
-- 6. PROJECT ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO project_assignments (project_id, employee_id, role)
VALUES
-- HR Platform (id=1)
(1, 5,  'tech lead'),
(1, 6,  'frontend developer'),
(1, 7,  'backend developer'),
(1, 8,  'mobile developer'),
(1, 9,  'ui/ux designer'),
(1, 10, 'full stack intern'),
(1, 12, 'frontend intern'),
(1, 13, 'ui/ux intern'),
(1, 14, 'ui/ux intern'),

-- Rara Delivery App (id=2)
(2, 5,  'architect'),
(2, 7,  'backend lead'),
(2, 8,  'mobile lead'),
(2, 11, 'mobile intern'),
(2, 9,  'ui/ux designer'),

-- Client Analytics Dashboard (id=3)
(3, 5,  'tech lead'),
(3, 6,  'frontend developer'),
(3, 7,  'backend developer'),
(3, 9,  'ui/ux designer'),

-- Rara Admin Portal (id=4)
(4, 5,  'architect'),
(4, 6,  'frontend developer'),
(4, 10, 'full stack intern')

ON DUPLICATE KEY UPDATE role = VALUES(role);

-- ─────────────────────────────────────────────────────────────
-- 7. MILESTONES
-- ─────────────────────────────────────────────────────────────

INSERT INTO milestones (id, project_id, title, due_date, status)
VALUES
-- HR Platform
(1,  1, 'Authentication & role system',          '2022-09-30', 'completed'),
(2,  1, 'Employee & leave management',            '2023-01-31', 'completed'),
(3,  1, 'Payroll & compensation module',          '2023-06-30', 'completed'),
(4,  1, 'Performance reviews & goals',            '2024-03-31', 'completed'),
(5,  1, 'MCP server & AI integrations',          '2026-09-30', 'completed'),
(6,  1, 'Mobile app companion',                  '2026-12-31', 'in_progress'),

-- Rara Delivery App
(7,  2, 'UX research & wireframes',              '2024-03-31', 'completed'),
(8,  2, 'Backend API & authentication',          '2024-07-31', 'completed'),
(9,  2, 'Driver & order tracking MVP',           '2025-01-31', 'completed'),
(10, 2, 'Payment gateway integration',           '2025-06-30', 'completed'),
(11, 2, 'Push notifications & chat',             '2026-08-31', 'in_progress'),
(12, 2, 'v2.0 public launch',                   '2026-11-30', 'pending'),

-- Client Analytics Dashboard
(13, 3, 'Data pipeline & schema design',         '2025-08-31', 'completed'),
(14, 3, 'KPI widget library',                    '2026-07-31', 'completed'),
(15, 3, 'Export & scheduling features',          '2026-09-30', 'in_progress'),
(16, 3, 'Beta release to clients',               '2026-10-31', 'pending'),

-- Admin Portal
(17, 4, 'Requirements & architecture',           '2025-05-31', 'completed'),
(18, 4, 'Core admin dashboard',                  '2026-09-30', 'pending'),
(19, 4, 'Billing & subscription module',         '2027-01-31', 'pending')

ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ─────────────────────────────────────────────────────────────
-- 8. STANDUPS (last 10 working days ending 2026-10-02)
-- ─────────────────────────────────────────────────────────────

INSERT INTO standups (employee_id, yesterday, today, blockers, standup_date) VALUES

-- 2026-10-02 (Thursday — today)
(5,  'Reviewed and merged MCP tool handler PR, fixed edge case in session refresh.',
     'Demo MCP tools with Claude Desktop to CTO. Write integration tests for all 18 MCP endpoints.',
     NULL, '2026-10-02'),

(6,  'Completed leave request form with inline validation and status badges.',
     'Integrate with backend leave approval API. Write unit tests for form component.',
     NULL, '2026-10-02'),

(7,  'Implemented leave approval/rejection endpoints with email notifications.',
     'Add pagination to employee listing endpoint. Write API docs for leave module.',
     NULL, '2026-10-02'),

(9,  'Finalised Q4 wireframes for analytics export feature.',
     'Hand off screens to Prayash for implementation. Create high-fidelity mockups.',
     NULL, '2026-10-02'),

(10, 'Added employee onboarding wizard — steps 1-3 complete.',
     'Implement document upload step. Connect form to backend API.',
     'Need backend endpoint for document upload — pending Prayash.', '2026-10-02'),

-- 2026-10-01 (Wednesday)
(5,  'Reviewed 3 PRs: leave module, onboarding wizard, dashboard filters.',
     'Fix session token refresh bug in MCP server. Merge and deploy to staging.',
     NULL, '2026-10-01'),

(6,  'Built date-range and status filter components for analytics dashboard.',
     'Polish leave request form UI. Get design sign-off.',
     NULL, '2026-10-01'),

(7,  'Implemented document upload endpoint with S3 integration.',
     'Leave approval API with notification hooks. Write tests.',
     NULL, '2026-10-01'),

(8,  'Completed real-time driver location tracking screen.',
     'Implement push notification deep links. QA testing on Android.',
     'Maps SDK billing alert — asked DevOps.', '2026-10-01'),

(11, 'Fixed icon alignment issues on the order detail screen.',
     'Work on notification UI component. Test on iPhone 14.',
     NULL, '2026-10-01'),

-- 2026-09-30 (Tuesday)
(5,  'Wrote MCP tool handlers for employees and leave domains.',
     'Work on standup and project tool handlers. Test with MCP Inspector.',
     NULL, '2026-09-30'),

(6,  'Implemented line and bar chart wrappers using Recharts.',
     'Build dashboard filter components. Integrate with real API data.',
     NULL, '2026-09-30'),

(7,  'Integrated Firebase Cloud Messaging for push notifications.',
     'Document upload endpoint. Handle notification failures gracefully.',
     NULL, '2026-09-30'),

(9,  'Designed PDF and CSV export flow UI for analytics.',
     'Finalise Q4 wireframes. Review with Kshitiz.',
     NULL, '2026-09-30'),

(12, 'Fixed responsive layout bug on the employee profile page.',
     'Work on leave request form. Deploy fix to staging.',
     NULL, '2026-09-30'),

-- 2026-09-29 (Monday)
(5,  'Scaffolded MCP server, installed SDK, set up auth module.',
     'Write tool handlers for all domains. Test with Claude Desktop.',
     NULL, '2026-09-29'),

(7,  'Researched Firebase Cloud Messaging setup and wrote spike.',
     'Implement push notification service. Set up FCM project credentials.',
     NULL, '2026-09-29'),

(8,  'Fixed GPS accuracy issue on driver tracking map.',
     'Complete delivery tracking real-time screen. Test background location on iOS.',
     NULL, '2026-09-29'),

(10, 'Scaffolded multi-step onboarding wizard component.',
     'Implement steps 1-3. Connect to backend API.',
     NULL, '2026-09-29'),

-- 2026-09-26 (Friday)
(5,  'Led Q3 retrospective session, documented action items.',
     'Start MCP server scaffolding. Assign Q4 sprint stories.',
     NULL, '2026-09-26'),

(6,  'Implemented performance review submission form.',
     'Analytics chart components. Get design review.',
     NULL, '2026-09-26'),

(7,  'Optimised slow employee listing query — reduced latency by 60%.',
     'Research FCM for push notifications. Deploy optimisation to production.',
     NULL, '2026-09-26'),

(8,  'Finalised onboarding screens for delivery app.',
     'Fix GPS accuracy issue. Push to TestFlight.',
     NULL, '2026-09-26'),

(9,  'Updated design system tokens for Q4 dashboard redesign.',
     'Export feature UI design. Publish updated Figma library.',
     NULL, '2026-09-26'),

(13, 'Exported all icon assets for HR platform v2 UI refresh.',
     'Create loading skeleton designs. Hand off to frontend.',
     NULL, '2026-09-26'),

(14, 'Designed onboarding wizard illustrations for HR Platform.',
     'Create empty-state illustrations. Review with Riya.',
     NULL, '2026-09-26');

-- ─────────────────────────────────────────────────────────────
-- 9. CULTURE EVENTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO culture_events (title, event_type, employee_id, event_date, description)
VALUES
('Kshitiz''s Work Anniversary',  'anniversary', 5,  '2026-07-01', '4 years at Rara Labs — thank you for the amazing contributions!'),
('Rama''s Work Anniversary',     'anniversary', 6,  '2026-08-01', '3.5 years at Rara Labs. Here''s to many more!'),
('Prayash''s Work Anniversary',  'anniversary', 7,  '2026-10-15', '3.5 years of solid backend work!'),
('Archana''s Work Anniversary',  'anniversary', 8,  '2026-12-01', '3.5 years of mobile magic at Rara Labs!'),
('Riya''s Work Anniversary',     'anniversary', 9,  '2026-08-15', '3 years of beautiful designs — thank you, Riya!'),
('Bal''s Birthday',              'birthday',    1,  '2026-11-12', 'Happy Birthday to our CEO!'),
('RamChandra''s Birthday',       'birthday',    4,  '2026-11-18', 'Happy Birthday to our CTO!'),
('Kshitiz''s Birthday',          'birthday',    5,  '2027-04-15', 'Team celebration planned'),
('Rama''s Birthday',             'birthday',    6,  '2027-08-22', 'Cake and celebration in office'),
('Prayash''s Birthday',          'birthday',    7,  '2026-12-05', 'Team wishes Prayash a happy birthday!'),
('Q3 Team Outing',               'team_event',  NULL,'2026-09-20', 'Team outing to Nagarkot — hiking and bonding day'),
('Dashain Team Celebration',     'team_event',  NULL,'2026-10-10', 'Dashain celebration at office — tika, gifts, and lunch'),
('Intern Welcome Lunch',         'team_event',  NULL,'2026-07-05', 'Welcome lunch for the 2026 intern batch at The Bakery Café')

ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ─────────────────────────────────────────────────────────────
-- 10. GOALS (Q4 2026)
-- ─────────────────────────────────────────────────────────────

INSERT INTO goals (employee_id, title, description, category, metric_unit, target_value, current_value, weight, status, start_date, due_date, created_by)
VALUES
-- Company goals
(1,  'Launch Rara Delivery App v2.0',
     'Full public launch of Rara Delivery App with payment gateway and push notifications.',
     'company', '%', 100, 40, 5, 'in_progress', '2026-10-01', '2026-11-30', 1),

(1,  'Achieve 50 active business clients',
     'Grow paying client base from 32 to 50 by Q4 end.',
     'company', 'clients', 50, 35, 4, 'in_progress', '2026-10-01', '2026-12-31', 1),

-- Team goals
(4,  'Complete MCP server integration with all domains',
     'Ship all 18 MCP tool handlers and demo to team.',
     'team', '%', 100, 80, 4, 'in_progress', '2026-09-01', '2026-10-15', 4),

(5,  'Achieve 95% uptime on production services',
     'Maintain production reliability and reduce incident response time.',
     'team', '%', 95, 99, 3, 'in_progress', '2026-10-01', '2026-12-31', 4),

-- Individual goals
(5,  'Ship HR Platform mobile companion app MVP',
     'Deliver React Native app with leave, standup, and profile features.',
     'individual', '%', 100, 20, 5, 'in_progress', '2026-10-01', '2026-12-31', 4),

(6,  'Improve frontend test coverage to 80%',
     'Write unit and integration tests for all major UI components.',
     'individual', '%', 80, 45, 3, 'in_progress', '2026-10-01', '2026-12-31', 5),

(7,  'Complete backend API documentation',
     'Document all public API endpoints in OpenAPI 3.0 format.',
     'individual', '%', 100, 60, 3, 'in_progress', '2026-09-01', '2026-10-31', 5),

(8,  'Ship delivery tracking feature with offline support',
     'Implement offline-first tracking with local data sync for poor connectivity.',
     'individual', '%', 100, 35, 4, 'in_progress', '2026-10-01', '2026-12-31', 5),

(9,  'Publish Rara design system to Figma Community',
     'Finalize and publish the Rara design system as a Figma Community file.',
     'individual', '%', 100, 50, 3, 'in_progress', '2026-10-01', '2026-12-31', 5);

-- ─────────────────────────────────────────────────────────────
-- 11. PERFORMANCE REVIEWS (2026-H1)
-- ─────────────────────────────────────────────────────────────

INSERT INTO performance_reviews
  (employee_id, reviewer_id, review_period, overall_rating, category_ratings, strengths, improvements, manager_comments, employee_comments, status, submitted_at, acknowledged_at)
VALUES
(5, 4, '2026-H1', 4.6,
  JSON_OBJECT('communication', 5, 'technical_skills', 5, 'teamwork', 4, 'punctuality', 5),
  'Exceptional full-stack skills and project ownership. Led the MCP integration from scratch.',
  'Could delegate more to interns to help them grow faster.',
  'Kshitiz has been the backbone of the HR platform this half. Outstanding delivery.',
  'Thank you! I want to mentor the interns more in Q4.',
  'acknowledged', '2026-07-10 10:00:00', '2026-07-11 09:00:00'),

(6, 5, '2026-H1', 4.1,
  JSON_OBJECT('communication', 4, 'technical_skills', 4, 'teamwork', 5, 'punctuality', 4),
  'Great collaboration with design and backend teams. Clean, well-structured component code.',
  'Should invest more in testing and performance optimization.',
  'Rama is a reliable contributor who keeps the frontend quality high.',
  'Will focus on writing more tests in Q4.',
  'acknowledged', '2026-07-12 11:00:00', '2026-07-13 10:30:00'),

(7, 5, '2026-H1', 4.3,
  JSON_OBJECT('communication', 4, 'technical_skills', 5, 'teamwork', 4, 'punctuality', 4),
  'Strong API design skills and proactively optimised several slow queries.',
  'Communication with frontend team on API changes could be more proactive.',
  'Prayash consistently delivers solid backend work and takes ownership of quality.',
  'Will improve on earlier communication about breaking API changes.',
  'submitted', '2026-07-08 14:00:00', NULL),

(8, 5, '2026-H1', 4.0,
  JSON_OBJECT('communication', 4, 'technical_skills', 4, 'teamwork', 4, 'punctuality', 4),
  'Delivered mobile tracking feature on time. Good cross-platform skills.',
  'Should write more automated tests for critical mobile flows.',
  'Archana takes on challenging features and delivers consistently.',
  NULL,
  'submitted', '2026-07-09 15:00:00', NULL),

(9, 5, '2026-H1', 4.4,
  JSON_OBJECT('communication', 5, 'technical_skills', 4, 'teamwork', 5, 'punctuality', 4),
  'Beautiful, accessible UI designs. Great cross-team collaboration and design system work.',
  'Could push back earlier when designs are technically infeasible.',
  'Riya elevates every product she touches. Her design system work saves the whole team time.',
  'Appreciate the recognition! I will speak up earlier on feasibility concerns.',
  'acknowledged', '2026-07-11 09:00:00', '2026-07-12 08:00:00');

-- ─────────────────────────────────────────────────────────────
-- 12. FEEDBACK NOTES
-- ─────────────────────────────────────────────────────────────

INSERT INTO feedback_notes (from_employee_id, to_employee_id, feedback_type, visibility, message, project_id)
VALUES
(6, 5, 'praise', 'public',
 'Kshitiz, the code review feedback you gave on my chart components was incredibly detailed and helped me write much cleaner code. Thank you!', 3),

(7, 5, 'praise', 'public',
 'Great architecture decision on the MCP server — the layered approach makes adding new tools so easy.', 1),

(5, 7, 'constructive', 'private',
 'Please communicate breaking API changes to the frontend team at least a day in advance. It blocked Rama twice this sprint.', 1),

(4, 5, 'praise', 'public',
 'Kshitiz handled the sprint crunch beautifully and kept everyone calm and focused. Real leadership.', 1),

(9, 6, 'praise', 'public',
 'Rama implemented the design system tokens perfectly. It made my handoff process so smooth!', 1),

(8, 9, 'praise', 'public',
 'The delivery app onboarding screens Riya designed are beautiful and user-tested brilliantly. Kudos!', 2);

-- ─────────────────────────────────────────────────────────────
-- 13. POLICIES
-- ─────────────────────────────────────────────────────────────

INSERT INTO policies (type, title, file_path, version, uploaded_by, is_active, category, is_pinned)
VALUES
('document', 'Leave Policy',            'policies/leave-policy-v1.pdf',            1, 3, 1, 'leave',   1),
('document', 'Remote Work Policy',      'policies/remote-work-policy-v1.pdf',      1, 3, 1, 'hr',      1),
('document', 'Code of Conduct',         'policies/code-of-conduct-v1.pdf',         1, 3, 1, 'general', 0),
('document', 'Equipment & Asset Policy','policies/equipment-asset-policy-v1.pdf',  1, 3, 1, 'general', 0);

-- ─────────────────────────────────────────────────────────────
-- 14. HOLIDAYS (Nepal — FY 2026-2027)
-- ─────────────────────────────────────────────────────────────

INSERT IGNORE INTO holidays (name, holiday_date, year)
VALUES
('New Year''s Day',        '2026-01-01', 2026),
('Prithvi Jayanti',        '2026-01-11', 2026),
('Maha Shivaratri',        '2026-02-26', 2026),
('Holi',                   '2026-03-14', 2026),
('Nepal New Year',         '2026-04-14', 2026),
('International Workers'' Day', '2026-05-01', 2026),
('Buddha Jayanti',         '2026-05-23', 2026),
('Republic Day',           '2026-05-28', 2026),
('Ghatasthapana',          '2026-10-02', 2026),
('Maha Ashtami',           '2026-10-09', 2026),
('Maha Navami',            '2026-10-10', 2026),
('Vijaya Dashami',         '2026-10-11', 2026),
('Laxmi Puja',             '2026-10-19', 2026),
('Mha Puja',               '2026-10-20', 2026),
('Bhaitika',               '2026-10-22', 2026),
('Chhath Parwa',           '2026-10-29', 2026),
('Christmas Day',          '2026-12-25', 2026);

-- ─────────────────────────────────────────────────────────────
-- 15. TAX PROFILES (PAN-linked, FY 2026)
-- ─────────────────────────────────────────────────────────────

INSERT IGNORE INTO employee_tax_profiles (panNo, month, year, amount, tax_amount, tax_perc)
VALUES
-- Kshitiz (monthly salary 1500 USD ~ NPR 200,000)
('PAN-200005', 7, 2026, 1500.00, 225.00, 15.00),
('PAN-200005', 8, 2026, 1500.00, 225.00, 15.00),
('PAN-200005', 9, 2026, 1500.00, 225.00, 15.00),
-- Rama
('PAN-200006', 7, 2026, 1050.00, 105.00, 10.00),
('PAN-200006', 8, 2026, 1050.00, 105.00, 10.00),
('PAN-200006', 9, 2026, 1050.00, 105.00, 10.00),
-- Prayash
('PAN-200007', 7, 2026, 1100.00, 110.00, 10.00),
('PAN-200007', 8, 2026, 1100.00, 110.00, 10.00),
('PAN-200007', 9, 2026, 1100.00, 110.00, 10.00),
-- Archana
('PAN-200008', 7, 2026, 1050.00, 105.00, 10.00),
('PAN-200008', 8, 2026, 1050.00, 105.00, 10.00),
('PAN-200008', 9, 2026, 1050.00, 105.00, 10.00),
-- Riya
('PAN-200009', 7, 2026,  980.00,  98.00, 10.00),
('PAN-200009', 8, 2026,  980.00,  98.00, 10.00),
('PAN-200009', 9, 2026,  980.00,  98.00, 10.00);

-- ─────────────────────────────────────────────────────────────
-- 16. OVERTIME REQUESTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO overtime_requests
  (employee_id, project_id, work_date, hours, reason, approved_by_name, status, reviewed_by, reviewed_at, hourly_rate, overtime_rate, amount)
VALUES
(5,  1, '2026-09-20', 3.0, 'Pre-launch MCP server stability testing',       'RamChandra Thapa', 'approved', 4, '2026-09-21 10:00:00', 9.375, 14.06, 42.18),
(7,  2, '2026-09-27', 2.5, 'Push notification service debugging over weekend','Kshitiz Gajurel',  'approved', 5, '2026-09-28 09:00:00', 6.875, 10.31, 25.78),
(8,  2, '2026-09-27', 2.0, 'Mobile app critical bug fix for iOS crash',       'Kshitiz Gajurel',  'approved', 5, '2026-09-28 09:00:00', 6.563, 9.84,  19.68),
(6,  3, '2026-09-19', 1.5, 'Analytics dashboard deadline crunch',             'Kshitiz Gajurel',  'pending',  NULL, NULL, NULL, NULL, NULL),
(10, 1, '2026-09-26', 2.0, 'Onboarding wizard frontend — sprint deadline',    'Kshitiz Gajurel',  'pending',  NULL, NULL, NULL, NULL, NULL);

-- ─────────────────────────────────────────────────────────────
-- 17. PAYROLL ADJUSTMENTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO payroll_adjustments (employee_id, type, title, amount, year, month, reference_type, reference_id, notes)
VALUES
(5,  'overtime_pay',    'Overtime — MCP Pre-launch Testing',       42.18, 2026, 9, 'overtime_request', 1, 'Approved overnight session before MCP launch'),
(7,  'overtime_pay',    'Overtime — Weekend Push Notification Fix', 25.78, 2026, 9, 'overtime_request', 2, 'Critical delivery app fix'),
(8,  'overtime_pay',    'Overtime — iOS Crash Fix',                 19.68, 2026, 9, 'overtime_request', 3, 'Hotfix for App Store release'),
(9,  'leave_bonus',     'Unused Leave Encashment',                 120.00, 2026, 9, 'leave_request',    5, 'Q3 unused leave payout'),
(6,  'leave_deduction', 'Unpaid Leave — Exceeded Balance',         -45.00, 2026, 8, 'leave_request',    6, 'One additional day beyond approved balance');

-- ─────────────────────────────────────────────────────────────
-- 18. EMPLOYEE SECONDARY EMAILS
-- ─────────────────────────────────────────────────────────────

UPDATE employees SET secondary_email = 'kshitiz.gajurel@gmail.com'      WHERE id = 5;
UPDATE employees SET secondary_email = 'rama.bhattarai@gmail.com'        WHERE id = 6;
UPDATE employees SET secondary_email = 'prayashjkhadka@gmail.com'        WHERE id = 7;
UPDATE employees SET secondary_email = 'archana.acharya01@gmail.com'     WHERE id = 8;
UPDATE employees SET secondary_email = 'riyasunar.design@gmail.com'      WHERE id = 9;
UPDATE employees SET secondary_email = 'rajat.pradhan02@gmail.com'       WHERE id = 10;
UPDATE employees SET secondary_email = 'nirdeshika.chauhan@gmail.com'    WHERE id = 11;
UPDATE employees SET secondary_email = 'premkathayat03@gmail.com'        WHERE id = 12;
UPDATE employees SET secondary_email = 'apekshya.poudel@gmail.com'       WHERE id = 13;
UPDATE employees SET secondary_email = 'jasmine.sharma.np@gmail.com'     WHERE id = 14;

-- ─────────────────────────────────────────────────────────────
-- 19. SERVERS (dev / staging / production per project)
-- ─────────────────────────────────────────────────────────────

INSERT INTO servers (project_id, name, environment, ip_address, domain, ssh_user, notes, is_sensitive, created_by)
VALUES
-- HR Platform
(1, 'HR Platform Dev',        'development', '127.0.0.1',       'localhost:6002',                 'kshitiz',  'Local dev — runs via npm run dev', 0, 5),
(1, 'HR Platform Staging',    'staging',     '45.32.185.42',    'staging.hr.raralabs.com',        'deploy',   'DigitalOcean droplet — Ubuntu 22.04. Deploy via PM2.', 0, 5),
(1, 'HR Platform Production', 'production',  '139.59.32.181',   'hr.raralabs.com',                'deploy',   'DigitalOcean droplet — Ubuntu 22.04. Nginx reverse proxy, SSL via Certbot. 2 vCPU / 4 GB RAM.', 1, 5),

-- Rara Delivery App
(2, 'Delivery App Dev',       'development', '127.0.0.1',       'localhost:4000',                 'prayash',  'Local dev — PostgreSQL + Redis via Docker Compose', 0, 7),
(2, 'Delivery App Staging',   'staging',     '45.76.121.88',    'staging.delivery.raralabs.com',  'deploy',   'Vultr instance — 2 vCPU / 4 GB. Postgres 15, Redis 7.', 0, 7),
(2, 'Delivery App Production','production',  '139.84.166.124',  'api.raralabs.com',               'deploy',   'AWS EC2 t3.medium — us-east-1. RDS PostgreSQL, ElastiCache Redis. Auto-deploy from main.', 1, 7),

-- Analytics Dashboard
(3, 'Analytics Dev',          'development', '127.0.0.1',       'localhost:3001',                 'kshitiz',  'Vite + Node.js local dev', 0, 5),
(3, 'Analytics Staging',      'staging',     '45.32.185.42',    'staging.analytics.raralabs.com', 'deploy',   'Shared staging droplet — port 3001', 0, 5),
(3, 'Analytics Production',   'production',  '139.59.32.181',   'analytics.raralabs.com',         'deploy',   'Shared production droplet — Nginx sub-domain routing.', 1, 5),

-- Admin Portal
(4, 'Admin Portal Dev',       'development', '127.0.0.1',       'localhost:5000',                 'kshitiz',  'Local dev — on_hold project', 0, 5);

-- ─────────────────────────────────────────────────────────────
-- 20. PROJECT SERVICES (integrations per project)
-- ─────────────────────────────────────────────────────────────

INSERT IGNORE INTO project_services (project_id, service_key) VALUES
(1, 'github'),
(1, 'discord'),
(1, 'google_calendar'),
(2, 'github'),
(2, 'firebase'),
(2, 'google_maps'),
(2, 'stripe'),
(3, 'github'),
(3, 'google_analytics'),
(4, 'github');

-- ─────────────────────────────────────────────────────────────
-- 21. PROJECT TODOS (sprint backlog items)
-- ─────────────────────────────────────────────────────────────

INSERT INTO project_todos (project_id, title, description, deadline, is_complete, sort_order, created_by) VALUES
-- HR Platform todos
(1, 'Mobile companion app — leave module',
 'Build the leave request and approval screens in the React Native companion app.',
 '2026-11-15', 0, 1, 5),
(1, 'Mobile companion app — standup module',
 'Add daily standup submission and history view to the mobile app.',
 '2026-11-30', 0, 2, 5),
(1, 'MCP server — projects & milestones tools',
 'Implement MCP tool handlers for the projects and milestones domains.',
 '2026-10-10', 0, 3, 5),
(1, 'Payroll PDF report generation',
 'Generate downloadable payslip PDFs for each employee per month.',
 '2026-10-31', 0, 4, 5),
(1, 'Two-factor authentication (TOTP)',
 'Add TOTP-based 2FA as an optional security layer for all accounts.',
 '2026-12-15', 0, 5, 5),
(1, 'Employee onboarding document upload',
 'Allow new hires to upload citizenship, PAN, and NDA documents via onboarding form.',
 '2026-10-07', 0, 6, 5),
(1, 'Audit log for sensitive actions',
 'Log all role changes, salary updates, and document access for compliance.',
 '2026-11-30', 0, 7, 4),
(1, 'Performance review — self-assessment flow',
 'Let employees submit a self-assessment before the manager review cycle opens.',
 '2026-11-01', 0, 8, 5),
(1, 'Fix leave balance year rollover',
 'Sick leave totals are not resetting at year boundary for interns.',
 '2026-10-05', 1, 9, 7),
(1, 'Dashboard — team attendance heatmap',
 'Show a 12-week attendance / leave heatmap on the admin dashboard.',
 '2026-12-31', 0, 10, 5),

-- Rara Delivery App todos
(2, 'Push notifications — order status updates',
 'Send FCM push notifications to customers when order status changes.',
 '2026-10-20', 0, 1, 7),
(2, 'In-app chat — driver ↔ customer',
 'Real-time chat between driver and customer using WebSocket.',
 '2026-10-31', 0, 2, 7),
(2, 'Offline map caching',
 'Cache map tiles locally so tracking works in low-connectivity areas.',
 '2026-11-15', 0, 3, 8),
(2, 'Stripe payment gateway integration',
 'Connect Stripe for card payments on order checkout.',
 '2026-10-15', 0, 4, 7),
(2, 'Driver earnings dashboard',
 'Show daily/weekly earnings breakdown and trip history for drivers.',
 '2026-11-01', 0, 5, 8),
(2, 'App Store & Play Store submission',
 'Prepare production build, screenshots, and metadata for both stores.',
 '2026-11-20', 0, 6, 8),
(2, 'Rate & review system',
 'Allow customers to rate drivers and deliveries after completion.',
 '2026-11-10', 0, 7, 9),
(2, 'Beta testing with 50 users',
 'Onboard 50 beta users in Kathmandu for real-world testing.',
 '2026-10-25', 0, 8, 4),

-- Analytics Dashboard todos
(3, 'CSV & PDF export feature',
 'Let users export any dashboard view as CSV or PDF with custom date ranges.',
 '2026-10-20', 0, 1, 6),
(3, 'Scheduled email reports',
 'Send weekly/monthly snapshot emails to subscribed client users.',
 '2026-10-31', 0, 2, 7),
(3, 'Funnel analysis widget',
 'Add a configurable conversion funnel widget to the KPI library.',
 '2026-11-15', 0, 3, 6),
(3, 'Client-level data isolation',
 'Ensure each client can only see their own data — row-level security audit.',
 '2026-10-10', 0, 4, 7),
(3, 'Dark mode support',
 'Add system-preference-aware dark mode to the dashboard.',
 '2026-10-28', 0, 5, 9),
(3, 'Custom dashboard layout builder',
 'Drag-and-drop widget layout that persists per user.',
 '2026-11-30', 0, 6, 5),
(3, 'Completed — data pipeline v1',
 'ETL pipeline from operational DB to analytics warehouse. Done.',
 '2026-08-31', 1, 7, 5);

-- ─────────────────────────────────────────────────────────────
-- 22. MEETINGS (recurring + ad-hoc)
-- ─────────────────────────────────────────────────────────────

INSERT INTO meetings (title, description, start_datetime, end_datetime, attendees, meet_link, status, created_by) VALUES
('Weekly All-Hands — Rara Labs',
 'Company-wide weekly sync: project updates, announcements, and Q&A.',
 '2026-10-05 10:00:00', '2026-10-05 11:00:00',
 '[1,2,3,4,5,6,7,8,9,10,11,12,13,14]',
 'https://meet.google.com/abc-defg-hij', 'scheduled', 1),

('Engineering Standup — Week 41',
 'Daily async standups collected; sync for blockers only.',
 '2026-10-07 09:30:00', '2026-10-07 09:50:00',
 '[4,5,6,7,8,9,10,11,12,13,14]',
 'https://meet.google.com/klm-nopq-rst', 'scheduled', 4),

('Sprint Planning — Q4 Sprint 2',
 'Plan and estimate stories for the next 2-week sprint across all projects.',
 '2026-10-06 14:00:00', '2026-10-06 16:00:00',
 '[4,5,6,7,8,9]',
 'https://meet.google.com/uvw-xyza-bcd', 'scheduled', 5),

('Delivery App — Push Notification Design Review',
 'Review Riya''s push notification UI designs and agree on copy + icons.',
 '2026-10-08 11:00:00', '2026-10-08 11:45:00',
 '[5,7,8,9,11]',
 'https://meet.google.com/efg-hijk-lmn', 'scheduled', 7),

('1:1 — Kshitiz & RamChandra',
 'Weekly 1:1 between tech lead and CTO. Progress, blockers, career.',
 '2026-10-03 15:00:00', '2026-10-03 15:30:00',
 '[4,5]',
 'https://meet.google.com/opq-rstu-vwx', 'scheduled', 4),

('1:1 — Kshitiz & Rama',
 'Weekly check-in with frontend engineer.',
 '2026-10-04 16:00:00', '2026-10-04 16:30:00',
 '[5,6]',
 'https://meet.google.com/yza-bcde-fgh', 'scheduled', 5),

('1:1 — Kshitiz & Prayash',
 'Weekly check-in with backend engineer.',
 '2026-10-04 17:00:00', '2026-10-04 17:30:00',
 '[5,7]',
 'https://meet.google.com/ijk-lmno-pqr', 'scheduled', 5),

('Analytics Dashboard — Client Beta Demo',
 'Demo the analytics export feature to two pilot clients before beta launch.',
 '2026-10-09 13:00:00', '2026-10-09 14:00:00',
 '[1,3,5,6,9]',
 'https://meet.google.com/stu-vwxy-zab', 'scheduled', 1),

('Q3 Retrospective (completed)',
 'Team retrospective for Q3 2026. Documented action items.',
 '2026-09-26 15:00:00', '2026-09-26 16:30:00',
 '[4,5,6,7,8,9,10,12,13,14]',
 'https://meet.google.com/cde-fghi-jkl', 'scheduled', 5),

('Intern Mid-term Review',
 'Structured mid-internship review for all 2026 interns with their mentors.',
 '2026-09-12 10:00:00', '2026-09-12 11:30:00',
 '[3,5,6,8,9,10,11,12,13,14]',
 'https://meet.google.com/mno-pqrs-tuv', 'scheduled', 3);

-- ─────────────────────────────────────────────────────────────
-- 23. WEEKLY REPORTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO weekly_reports (employee_id, title, week_start_date, file_name, file_path, file_size, notes, submitted_at) VALUES
(5,  'Week 39 — MCP Server Progress',          '2026-09-22', 'kshitiz_week39_report.pdf', 'reports/weekly/2026/kshitiz_week39_report.pdf', 245600, 'Covered MCP tool handler development, 3 PRs merged.', '2026-09-27 17:30:00'),
(5,  'Week 40 — Q3 Retro + Sprint Planning',   '2026-09-29', 'kshitiz_week40_report.pdf', 'reports/weekly/2026/kshitiz_week40_report.pdf', 198400, 'Q3 retrospective facilitated. Q4 sprint stories assigned.', '2026-10-03 18:00:00'),
(6,  'Week 39 — Analytics Chart Components',   '2026-09-22', 'rama_week39_report.pdf',    'reports/weekly/2026/rama_week39_report.pdf',    167200, 'Shipped Recharts wrapper components. 80% test coverage on new components.', '2026-09-27 18:00:00'),
(6,  'Week 40 — Dashboard Filters',            '2026-09-29', 'rama_week40_report.pdf',    'reports/weekly/2026/rama_week40_report.pdf',    154800, 'Date-range and status filters shipped. Leave request form in review.', '2026-10-03 17:45:00'),
(7,  'Week 39 — FCM & DB Optimisation',        '2026-09-22', 'prayash_week39_report.pdf', 'reports/weekly/2026/prayash_week39_report.pdf', 212000, 'FCM integrated. Employee listing query optimised — 60% faster.', '2026-09-27 17:00:00'),
(7,  'Week 40 — Document Upload API',          '2026-09-29', 'prayash_week40_report.pdf', 'reports/weekly/2026/prayash_week40_report.pdf', 188000, 'Document upload with S3 done. Leave approval API in progress.', '2026-10-03 17:30:00'),
(8,  'Week 39 — GPS & Map Screen',             '2026-09-22', 'archana_week39_report.pdf', 'reports/weekly/2026/archana_week39_report.pdf', 201600, 'GPS accuracy fix deployed. Driver tracking screen complete.', '2026-09-27 18:30:00'),
(8,  'Week 40 — Real-time Tracking',           '2026-09-29', 'archana_week40_report.pdf', 'reports/weekly/2026/archana_week40_report.pdf', 176400, 'Tracking screen with WebSocket live. Push notification deep links in progress.', '2026-10-03 18:15:00'),
(9,  'Week 39 — Design System Tokens',         '2026-09-22', 'riya_week39_report.pdf',    'reports/weekly/2026/riya_week39_report.pdf',    134400, 'Design system tokens refreshed for Q4. Export flow UI designed.', '2026-09-27 17:00:00'),
(9,  'Week 40 — Q4 Wireframes',               '2026-09-29', 'riya_week40_report.pdf',    'reports/weekly/2026/riya_week40_report.pdf',    158000, 'Finalised Q4 wireframes for analytics export. Push notification UI complete.', '2026-10-03 17:00:00'),
(10, 'Week 40 — Onboarding Wizard',            '2026-09-29', 'rajat_week40_report.pdf',   'reports/weekly/2026/rajat_week40_report.pdf',   120800, 'Onboarding wizard steps 1-3 complete. Document upload pending backend.', '2026-10-03 19:00:00'),
(12, 'Week 40 — Profile Page Bug Fix',         '2026-09-29', 'prem_week40_report.pdf',    'reports/weekly/2026/prem_week40_report.pdf',    98000,  'Fixed responsive layout bug on employee profile. Leave request form in progress.', '2026-10-03 19:30:00');

-- ─────────────────────────────────────────────────────────────
-- 24. MONTHLY REPORTS (Q3 2026)
-- ─────────────────────────────────────────────────────────────

INSERT INTO monthly_reports (employee_id, title, month, year, file_name, file_path, file_size, notes, submitted_at) VALUES
(5,  'September 2026 — Engineering Lead Report', 9, 2026, 'kshitiz_sep2026_report.pdf', 'reports/monthly/2026/kshitiz_sep2026_report.pdf', 512000, 'MCP server shipped, Q3 retrospective, 12 PRs reviewed and merged. Q4 sprint planned.', '2026-09-30 18:00:00'),
(5,  'August 2026 — Engineering Lead Report',    8, 2026, 'kshitiz_aug2026_report.pdf', 'reports/monthly/2026/kshitiz_aug2026_report.pdf', 487200, 'Analytics dashboard KPI library completed. Onboarding wizard started.', '2026-08-31 17:30:00'),
(6,  'September 2026 — Frontend Report',         9, 2026, 'rama_sep2026_report.pdf',    'reports/monthly/2026/rama_sep2026_report.pdf',    344000, 'Chart components, dashboard filters, performance review UI shipped.', '2026-09-30 18:30:00'),
(7,  'September 2026 — Backend Report',          9, 2026, 'prayash_sep2026_report.pdf', 'reports/monthly/2026/prayash_sep2026_report.pdf', 376000, 'FCM push notifications, document upload API, DB query optimisations.', '2026-09-30 17:30:00'),
(8,  'September 2026 — Mobile Report',           9, 2026, 'archana_sep2026_report.pdf', 'reports/monthly/2026/archana_sep2026_report.pdf', 360000, 'Driver tracking screen, GPS accuracy fix, push notification deep links started.', '2026-09-30 18:00:00'),
(9,  'September 2026 — Design Report',           9, 2026, 'riya_sep2026_report.pdf',    'reports/monthly/2026/riya_sep2026_report.pdf',    298000, 'Q4 wireframes, design system token refresh, push notification UI.', '2026-09-30 17:00:00');

-- ─────────────────────────────────────────────────────────────
-- 25. SERVICE CREDENTIALS
--     (dev-account credentials managed through the HR platform)
-- ─────────────────────────────────────────────────────────────

INSERT INTO service_credentials (employee_id, service_name, username, password, notes, created_by) VALUES
-- GitHub
(5,  'GitHub',        'kshitizgajurel',      'ghp_kx8Rz2QmP9v4Lw3Dn7Yt1Xs6Fb0Ck5Qe',  'Personal access token — expires 2027-01-01. Scopes: repo, workflow.', 4),
(6,  'GitHub',        'ramabhattarai',        'ghp_jY3Mb4Lp8Nw6Rq2Ts9Vf5Xd1Gz7Ak0Cm',  'Scopes: repo, read:org.', 5),
(7,  'GitHub',        'prayashjkhadka',       'ghp_mZ7Nt5Kw2Px9Lq4Ry8Vb3Jf0Cd6Gs1Ae',  'Scopes: repo, workflow, read:packages.', 5),
(8,  'GitHub',        'archana-acharya',      'ghp_aQ2Rk8Mv4Nw7Px3Ls6Yd9Tf1Gb5Cz0Je',  'Scopes: repo.', 5),
(9,  'GitHub',        'riyasunar',            'ghp_pB5St9Lw3Mv8Nq2Kx7Yd4Tf6Gb1Cz0Re',  'Read-only — design asset repos only.', 5),
-- Figma
(9,  'Figma',         'riya@raralabs.com',    'fig_sk_rK9Lx4Mw2Nv8Qp5Ys3Tb7Jf0Cz1Gd',  'Team plan token — Rara Labs workspace.', 5),
(13, 'Figma',         'apekshya@raralabs.com','fig_sk_aP3Qr7Ls4Mv9Nw2Kx8Yd5Tf1Gb6Cz',  'Viewer access — intern.', 9),
(14, 'Figma',         'jasmine@raralabs.com', 'fig_sk_jS6Rt2Lw8Mv4Nq3Kx9Yd7Tf5Gb0Cz',  'Viewer access — intern.', 9),
-- Jira / Linear
(5,  'Linear',        'kshitiz@raralabs.com', 'lin_api_kx7Rz4QmP2v9Lw6Dn3Yt8Xs1Fb5Ck', 'Admin API key — Rara Labs workspace.', 4),
(6,  'Linear',        'rama@raralabs.com',    'lin_api_rB4Ms8Lw3Nv7Qx2Ky9Yd6Tf0Gb1Cz', 'Member access.', 5),
(7,  'Linear',        'prayash@raralabs.com', 'lin_api_pJ7St3Lw9Mv5Nq8Kx4Yd2Tf6Gb0Cz', 'Member access.', 5),
-- Firebase
(7,  'Firebase',      'prayash@raralabs.com', 'fir_sk_pZ8Rt5Lw2Mv9Nq3Kx7Yd4Tf6Gb1Cz',  'Admin SDK key — Rara Delivery App project.', 5),
(8,  'Firebase',      'archana@raralabs.com', 'fir_sk_aQ4Rs7Lw3Mv8Nq2Kx9Yd5Tf1Gb6Cz',  'Mobile client config — Rara Delivery App.', 7),
-- AWS
(5,  'AWS',           'kshitiz-rara',         'AKIA2KSHITIZRARAAWS1',                    'IAM user — S3 and EC2 read/write. Keys rotated monthly.', 4),
(7,  'AWS S3',        'prayash-rara',          'AKIA2PRAYASHRARAAWS1',                    'S3 put/get for document upload — delivery app bucket only.', 5),
-- Stripe
(7,  'Stripe',        'prayash@raralabs.com', 'sk_test_rara51KxZ4eC1yMbcDwP8SHK9Lm2Qn', 'Test mode key — Rara Delivery App payments.', 5),
-- Google Maps
(8,  'Google Maps',   'archana@raralabs.com', 'AIzaSyRaraDeliveryMapsKEY2026XYZ12345',   'Maps JavaScript & Directions API key — delivery app.', 5);

-- ─────────────────────────────────────────────────────────────
-- 26. EMPLOYEE DOCUMENTS
-- ─────────────────────────────────────────────────────────────

INSERT INTO employee_documents (emp_id, url, name, filename) VALUES
-- Kshitiz
(5,  '/docs/employees/5/citizenship_front.jpg', 'citizenship_front',      'kshitiz_citizenship_front.jpg'),
(5,  '/docs/employees/5/citizenship_back.jpg',  'citizenship_back',       'kshitiz_citizenship_back.jpg'),
(5,  '/docs/employees/5/pan_card.jpg',          'pan_card',               'kshitiz_pan.jpg'),
(5,  '/docs/employees/5/nda.pdf',               'nda',                    'kshitiz_nda_signed.pdf'),
(5,  '/docs/employees/5/offer_letter.pdf',      'offer_letter',           'kshitiz_offer_letter.pdf'),
-- Rama
(6,  '/docs/employees/6/citizenship_front.jpg', 'citizenship_front',      'rama_citizenship_front.jpg'),
(6,  '/docs/employees/6/citizenship_back.jpg',  'citizenship_back',       'rama_citizenship_back.jpg'),
(6,  '/docs/employees/6/pan_card.jpg',          'pan_card',               'rama_pan.jpg'),
(6,  '/docs/employees/6/nda.pdf',               'nda',                    'rama_nda_signed.pdf'),
-- Prayash
(7,  '/docs/employees/7/citizenship_front.jpg', 'citizenship_front',      'prayash_citizenship_front.jpg'),
(7,  '/docs/employees/7/citizenship_back.jpg',  'citizenship_back',       'prayash_citizenship_back.jpg'),
(7,  '/docs/employees/7/pan_card.jpg',          'pan_card',               'prayash_pan.jpg'),
(7,  '/docs/employees/7/nda.pdf',               'nda',                    'prayash_nda_signed.pdf'),
-- Archana
(8,  '/docs/employees/8/citizenship_front.jpg', 'citizenship_front',      'archana_citizenship_front.jpg'),
(8,  '/docs/employees/8/pan_card.jpg',          'pan_card',               'archana_pan.jpg'),
(8,  '/docs/employees/8/nda.pdf',               'nda',                    'archana_nda_signed.pdf'),
-- Riya
(9,  '/docs/employees/9/citizenship_front.jpg', 'citizenship_front',      'riya_citizenship_front.jpg'),
(9,  '/docs/employees/9/citizenship_back.jpg',  'citizenship_back',       'riya_citizenship_back.jpg'),
(9,  '/docs/employees/9/pan_card.jpg',          'pan_card',               'riya_pan.jpg'),
(9,  '/docs/employees/9/nda.pdf',               'nda',                    'riya_nda_signed.pdf'),
-- Interns (offer letter + NDA only)
(10, '/docs/employees/10/nda.pdf',              'nda',                    'rajat_nda_signed.pdf'),
(10, '/docs/employees/10/offer_letter.pdf',     'offer_letter',           'rajat_intern_offer.pdf'),
(11, '/docs/employees/11/nda.pdf',              'nda',                    'nirdeshika_nda_signed.pdf'),
(11, '/docs/employees/11/offer_letter.pdf',     'offer_letter',           'nirdeshika_intern_offer.pdf'),
(12, '/docs/employees/12/nda.pdf',              'nda',                    'prem_nda_signed.pdf'),
(12, '/docs/employees/12/offer_letter.pdf',     'offer_letter',           'prem_intern_offer.pdf'),
(13, '/docs/employees/13/nda.pdf',              'nda',                    'apekshya_nda_signed.pdf'),
(13, '/docs/employees/13/offer_letter.pdf',     'offer_letter',           'apekshya_intern_offer.pdf'),
(14, '/docs/employees/14/nda.pdf',              'nda',                    'jasmine_nda_signed.pdf'),
(14, '/docs/employees/14/offer_letter.pdf',     'offer_letter',           'jasmine_intern_offer.pdf');

-- ─────────────────────────────────────────────────────────────
-- 27. POLICY ACKNOWLEDGEMENTS
--     All active employees acknowledge all policies on join date.
--     Interns acknowledge on 2026-07-01.
-- ─────────────────────────────────────────────────────────────

INSERT INTO policy_acknowledgements (policy_id, employee_id, signed_file_path, status, submitted_at, reviewed_by, reviewed_at) VALUES
-- Leave Policy (id=1) — all employees + interns
(1, 5,  'acks/leave_policy_kshitiz.pdf',      'approved', '2022-07-01 09:30:00', 3, '2022-07-01 11:00:00'),
(1, 6,  'acks/leave_policy_rama.pdf',          'approved', '2023-02-01 09:30:00', 3, '2023-02-01 11:00:00'),
(1, 7,  'acks/leave_policy_prayash.pdf',       'approved', '2023-04-15 09:30:00', 3, '2023-04-15 11:00:00'),
(1, 8,  'acks/leave_policy_archana.pdf',       'approved', '2023-06-01 09:30:00', 3, '2023-06-01 11:00:00'),
(1, 9,  'acks/leave_policy_riya.pdf',          'approved', '2023-08-15 09:30:00', 3, '2023-08-15 11:00:00'),
(1, 10, 'acks/leave_policy_rajat.pdf',         'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
(1, 11, 'acks/leave_policy_nirdeshika.pdf',    'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
(1, 12, 'acks/leave_policy_prem.pdf',          'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
(1, 13, 'acks/leave_policy_apekshya.pdf',      'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
(1, 14, 'acks/leave_policy_jasmine.pdf',       'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
-- Remote Work Policy (id=2) — employees only (interns are on-site)
(2, 5,  'acks/remote_policy_kshitiz.pdf',      'approved', '2022-07-01 09:30:00', 3, '2022-07-01 11:00:00'),
(2, 6,  'acks/remote_policy_rama.pdf',          'approved', '2023-02-01 09:30:00', 3, '2023-02-01 11:00:00'),
(2, 7,  'acks/remote_policy_prayash.pdf',       'approved', '2023-04-15 09:30:00', 3, '2023-04-15 11:00:00'),
(2, 8,  'acks/remote_policy_archana.pdf',       'approved', '2023-06-01 09:30:00', 3, '2023-06-01 11:00:00'),
(2, 9,  'acks/remote_policy_riya.pdf',          'approved', '2023-08-15 09:30:00', 3, '2023-08-15 11:00:00'),
-- Code of Conduct (id=3) — everyone
(3, 5,  'acks/coc_kshitiz.pdf',               'approved', '2022-07-01 09:30:00', 3, '2022-07-01 11:00:00'),
(3, 6,  'acks/coc_rama.pdf',                   'approved', '2023-02-01 09:30:00', 3, '2023-02-01 11:00:00'),
(3, 7,  'acks/coc_prayash.pdf',                'approved', '2023-04-15 09:30:00', 3, '2023-04-15 11:00:00'),
(3, 8,  'acks/coc_archana.pdf',                'approved', '2023-06-01 09:30:00', 3, '2023-06-01 11:00:00'),
(3, 9,  'acks/coc_riya.pdf',                   'approved', '2023-08-15 09:30:00', 3, '2023-08-15 11:00:00'),
(3, 10, 'acks/coc_rajat.pdf',                  'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
(3, 11, 'acks/coc_nirdeshika.pdf',             'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
(3, 12, 'acks/coc_prem.pdf',                   'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
(3, 13, 'acks/coc_apekshya.pdf',               'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
(3, 14, 'acks/coc_jasmine.pdf',                'approved', '2026-07-01 09:30:00', 3, '2026-07-01 11:00:00'),
-- Equipment Policy (id=4) — employees (interns don't get company hardware)
(4, 5,  'acks/equip_policy_kshitiz.pdf',       'approved', '2022-07-01 09:30:00', 3, '2022-07-01 11:00:00'),
(4, 6,  'acks/equip_policy_rama.pdf',           'approved', '2023-02-01 09:30:00', 3, '2023-02-01 11:00:00'),
(4, 7,  'acks/equip_policy_prayash.pdf',        'approved', '2023-04-15 09:30:00', 3, '2023-04-15 11:00:00'),
(4, 8,  'acks/equip_policy_archana.pdf',        'approved', '2023-06-01 09:30:00', 3, '2023-06-01 11:00:00'),
(4, 9,  'acks/equip_policy_riya.pdf',           'approved', '2023-08-15 09:30:00', 3, '2023-08-15 11:00:00');

-- ─────────────────────────────────────────────────────────────
-- 28. EMAIL SETTINGS (SMTP per admin / manager)
-- ─────────────────────────────────────────────────────────────

INSERT INTO email_settings (employee_id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, default_to, default_cc, created_by) VALUES
(3, 'smtp.gmail.com', 587, 'hr@raralabs.com',      'smtp_app_pass_dilip_hr2026',    'Rara Labs HR <hr@raralabs.com>',          NULL,                       'bal@raralabs.com,ramchandra@raralabs.com', 3),
(5, 'smtp.gmail.com', 587, 'kshitiz@raralabs.com', 'smtp_app_pass_kshitiz_2026',    'Kshitiz Gajurel <kshitiz@raralabs.com>', 'ramchandra@raralabs.com',  NULL, 3);

-- ─────────────────────────────────────────────────────────────
-- 29. ADDITIONAL LEAVE BALANCE DATA (year 2025 — historical)
-- ─────────────────────────────────────────────────────────────

INSERT INTO leave_balances (employee_id, leave_type, total, taken, year) VALUES
(5,'sick',12,4,2025),(5,'bereavement',3,0,2025),(5,'paternity',30,5,2025),
(6,'sick',12,3,2025),(6,'bereavement',3,0,2025),(6,'maternity',60,0,2025),
(7,'sick',12,2,2025),(7,'bereavement',3,1,2025),(7,'paternity',30,3,2025),
(8,'sick',12,1,2025),(8,'bereavement',3,0,2025),(8,'maternity',60,0,2025),
(9,'sick',12,5,2025),(9,'bereavement',3,0,2025),(9,'maternity',60,2,2025)
ON DUPLICATE KEY UPDATE total = VALUES(total), taken = VALUES(taken);

-- ─────────────────────────────────────────────────────────────
-- 30. EXTENDED STANDUPS — Q3 2026 (July–September)
--     ~4-5 working days per week, all 9 engineers+interns
--     Format: (emp_id, yesterday, today, blockers, date)
-- ─────────────────────────────────────────────────────────────

INSERT INTO standups (employee_id, yesterday, today, blockers, standup_date) VALUES

-- ══════════════ JULY 2026 ══════════════

-- 2026-07-01 (Wednesday — intern first day)
(5,  'Prepared onboarding plan for 2026 intern batch.',
     'Kickoff meeting with interns. Assign initial tasks.',
     NULL, '2026-07-01'),
(6,  'Finished leave balance calculation component.',
     'Review interns'' first tasks. Fix leave balance edge case for interns.',
     NULL, '2026-07-01'),
(7,  'Completed overtime API endpoints with rate calculation.',
     'Write integration tests for overtime module. Help Rajat get dev env running.',
     NULL, '2026-07-01'),
(8,  'Fixed iOS navigation crash on delivery app.',
     'Start mobile app onboarding screens design review.',
     NULL, '2026-07-01'),
(9,  'Completed mobile delivery app icon set (48 icons).',
     'Start onboarding screen designs for intern batch project.',
     NULL, '2026-07-01'),
(10, 'Set up local dev environment.',
     'Read HR Platform codebase. Fix first assigned bug: employee search not returning partial matches.',
     'Dev env setup took longer than expected — Prayash helped.', '2026-07-01'),
(12, 'Set up local dev environment.',
     'Explore React codebase. Fix first CSS issue on employee card component.',
     NULL, '2026-07-01'),
(13, 'Explored Figma workspace and existing design files.',
     'Start icon audit for HR platform v2 refresh.',
     NULL, '2026-07-01'),
(14, 'Explored Figma workspace.',
     'Assist Apekshya with icon audit. Learn design system tokens.',
     NULL, '2026-07-01'),

-- 2026-07-02 (Thursday)
(5,  'Intern kickoff done. Assigned first tasks to all 5 interns.',
     'Code review for Prayash''s overtime API. Plan sprint for July.',
     NULL, '2026-07-02'),
(6,  'Reviewed Rajat''s first PR — employee search fix. LGTM.',
     'Build leave balance year-rollover logic.',
     NULL, '2026-07-02'),
(7,  'Integration tests for overtime module — 12/15 passing.',
     'Fix remaining 3 failing tests. Deploy overtime API to staging.',
     'One test flaky due to timezone offset.', '2026-07-02'),
(8,  'Reviewed mobile onboarding screen designs with Riya.',
     'Implement onboarding screen 1 (welcome + role selection).',
     NULL, '2026-07-02'),
(9,  'Reviewed onboarding screen feedback from Archana.',
     'Refine onboarding screens. Export assets for handoff.',
     NULL, '2026-07-02'),
(10, 'Fixed employee search partial match bug. PR submitted.',
     'Work on second task: add department filter to employee listing.',
     NULL, '2026-07-02'),
(11, 'Set up React Native dev environment.',
     'Explore mobile codebase. Fix alignment bug on order card component.',
     'React Native Metro bundler crash on M1 Mac — resolved with patch.', '2026-07-02'),
(12, 'Fixed CSS issue on employee card. PR merged.',
     'Work on leave request form field validation error messages.',
     NULL, '2026-07-02'),
(13, 'Completed icon audit — 24 icons need refresh.',
     'Redesign high-priority icons (status badges, nav icons).',
     NULL, '2026-07-02'),
(14, 'Assisted Apekshya with icon audit.',
     'Redesign empty-state illustrations for leave and standup pages.',
     NULL, '2026-07-02'),

-- 2026-07-07 (Tuesday — after weekend)
(5,  'Merged overtime API. Deployed to staging.',
     'Start performance review module planning. Write technical spec.',
     NULL, '2026-07-07'),
(6,  'Completed year-rollover logic for leave balances.',
     'Start performance review UI — form component.',
     NULL, '2026-07-07'),
(7,  'Deployed overtime to staging. All tests green.',
     'Write overtime report generation API.',
     NULL, '2026-07-07'),
(8,  'Implemented onboarding screens 1 and 2.',
     'Implement onboarding screen 3 (profile photo upload).',
     'Profile photo upload needs S3 integration — coordinating with Prayash.', '2026-07-07'),
(9,  'Delivered updated icon set to Prem and Apekshya.',
     'Start delivery app customer-facing screen designs.',
     NULL, '2026-07-07'),
(10, 'Department filter working. PR under review.',
     'Add sorting to employee list by name and start date.',
     NULL, '2026-07-07'),
(11, 'Fixed order card alignment. PR merged.',
     'Implement swipe-to-dismiss on notification cards.',
     NULL, '2026-07-07'),
(12, 'Validation error messages done and merged.',
     'Start breadcrumb navigation component.',
     NULL, '2026-07-07'),
(13, 'Redesigned 16 status badge icons — Figma done.',
     'Export SVG assets and hand off to Prem.',
     NULL, '2026-07-07'),

-- 2026-07-08 (Wednesday)
(5,  'Tech spec for performance review module done. Shared with team.',
     'Kickoff performance review module implementation.',
     NULL, '2026-07-08'),
(6,  'Performance review form component — 50% done.',
     'Complete form, add rating sliders.',
     NULL, '2026-07-08'),
(7,  'Overtime report API — endpoint done, PDF generation in progress.',
     'Finish PDF generation using pdfkit.',
     NULL, '2026-07-08'),
(8,  'S3 photo upload integrated. Onboarding screen 3 done.',
     'Onboarding screen 4 — skills & interests.',
     NULL, '2026-07-08'),
(9,  'Customer home screen design — 70% done.',
     'Complete customer home and order history screens.',
     NULL, '2026-07-08'),

-- 2026-07-09 (Thursday)
(5,  'Reviewed performance review API spec from Prayash.',
     'Backend API for performance reviews — schema + endpoints.',
     NULL, '2026-07-09'),
(7,  'PDF generation for overtime reports working.',
     'Write performance review CRUD API.',
     NULL, '2026-07-09'),
(6,  'Performance review form complete.',
     'Review UI with design, add manager comment section.',
     NULL, '2026-07-09'),
(8,  'Onboarding screen 4 done.',
     'Final screen: document upload. Coordinate with Prayash for API.',
     NULL, '2026-07-09'),
(9,  'Customer home + order history screens done.',
     'Driver dashboard screen design.',
     NULL, '2026-07-09'),

-- 2026-07-14 (Tuesday)
(5,  'Performance review backend — models and endpoints done.',
     'Write tests, integrate with frontend.',
     NULL, '2026-07-14'),
(6,  'Performance review UI — review cycle and ratings done.',
     'Add history view and acknowledgement flow.',
     NULL, '2026-07-14'),
(7,  'Performance review API — CRUD + review cycle logic done.',
     'Write tests. Integrate email notifications on review submission.',
     NULL, '2026-07-14'),
(8,  'Mobile onboarding flow fully implemented.',
     'Start driver tracking map screen.',
     NULL, '2026-07-14'),
(9,  'Driver dashboard screen design done.',
     'Start delivery confirmation screen design.',
     NULL, '2026-07-14'),
(10, 'Employee sorting done. PR merged.',
     'Start intern task: add profile picture upload to employee form.',
     NULL, '2026-07-14'),
(11, 'Swipe-to-dismiss working on notifications.',
     'Add badge count on notification icon.',
     NULL, '2026-07-14'),
(12, 'Breadcrumb navigation done.',
     'Work on skeleton loading state for employee list.',
     NULL, '2026-07-14'),
(13, 'Status badge SVG assets handed off to Prem.',
     'Design leave calendar empty state.',
     NULL, '2026-07-14'),
(14, 'Empty-state illustrations for leave and standup pages done.',
     'Start onboarding wizard step illustrations.',
     NULL, '2026-07-14'),

-- 2026-07-21 (Tuesday)
(5,  'Performance review module shipped to staging. Demoed to CTO.',
     'Fix edge cases from demo feedback. Monitor staging logs.',
     NULL, '2026-07-21'),
(6,  'Acknowledgement flow and history view done. PR merged.',
     'Start analytics dashboard — charting research.',
     NULL, '2026-07-21'),
(7,  'Email notifications on review submission working.',
     'Fix timezone issue in leave overlap check.',
     'Timezone edge case needs careful handling with Nepal offset.', '2026-07-21'),
(8,  'Driver tracking map screen — basic map done.',
     'Add real-time location updates via WebSocket.',
     NULL, '2026-07-21'),
(9,  'Delivery confirmation + rating screens done.',
     'Start analytics dashboard design — initial wireframes.',
     NULL, '2026-07-21'),

-- 2026-07-28 (Tuesday)
(5,  'Performance review module deployed to production.',
     'Start analytics dashboard planning. Evaluate Recharts vs D3.',
     NULL, '2026-07-28'),
(6,  'Recharts spike done — chosen for analytics dashboard.',
     'Scaffold analytics dashboard page and routing.',
     NULL, '2026-07-28'),
(7,  'Leave overlap timezone issue fixed and tested.',
     'Write leave trend aggregation query for analytics.',
     NULL, '2026-07-28'),
(8,  'WebSocket real-time driver location working.',
     'Add background location update for iOS.',
     'iOS background location needs special entitlements.', '2026-07-28'),
(9,  'Analytics dashboard wireframes — 60% done.',
     'Complete wireframes. Present to Kshitiz.',
     NULL, '2026-07-28'),

-- ══════════════ AUGUST 2026 ══════════════

-- 2026-08-04 (Tuesday)
(5,  'Analytics dashboard architecture finalized. Data pipeline design done.',
     'Implement data aggregation endpoints for dashboard.',
     NULL, '2026-08-04'),
(6,  'Analytics dashboard routing and page scaffold done.',
     'Build first chart: employee headcount trend (line chart).',
     NULL, '2026-08-04'),
(7,  'Leave trend aggregation query written and optimized.',
     'Build remaining dashboard aggregation APIs.',
     NULL, '2026-08-04'),
(8,  'iOS background location working with significant-change API.',
     'Order status update broadcast via WebSocket.',
     NULL, '2026-08-04'),
(9,  'Analytics dashboard wireframes presented and approved.',
     'Start high-fidelity dashboard designs.',
     NULL, '2026-08-04'),
(10, 'Profile picture upload working on employee form.',
     'Add image cropper before upload.',
     NULL, '2026-08-04'),
(11, 'Badge count on notification icon done.',
     'Build driver location pin animation on map.',
     NULL, '2026-08-04'),
(12, 'Skeleton loading state for employee list done.',
     'Build file attachment preview component.',
     NULL, '2026-08-04'),
(13, 'Leave calendar empty state design done.',
     'Design analytics dashboard KPI cards.',
     NULL, '2026-08-04'),
(14, 'Onboarding wizard step illustrations done.',
     'Design 404 and error page illustrations.',
     NULL, '2026-08-04'),

-- 2026-08-11 (Tuesday)
(5,  'Dashboard aggregation APIs — 5/8 endpoints done.',
     'Complete remaining 3 endpoints. Write API tests.',
     NULL, '2026-08-11'),
(6,  'Headcount trend chart done. Leave trend chart in progress.',
     'Complete leave trend and overtime charts.',
     NULL, '2026-08-11'),
(7,  'All 8 dashboard APIs done and documented.',
     'Add caching layer to slow dashboard queries.',
     NULL, '2026-08-11'),
(8,  'Order status WebSocket broadcast working.',
     'Customer notification on driver arrival.',
     NULL, '2026-08-11'),
(9,  'KPI card designs done. Starting chart area designs.',
     'Design bar, line, and pie chart variants for dashboard.',
     NULL, '2026-08-11'),
(10, 'Image cropper integrated.',
     'Add drag-and-drop file upload to document section.',
     NULL, '2026-08-11'),
(11, 'Driver pin animation on map done.',
     'Implement route polyline between driver and destination.',
     NULL, '2026-08-11'),
(12, 'File attachment preview done.',
     'Build data table component with sort and pagination.',
     NULL, '2026-08-11'),

-- 2026-08-18 (Tuesday)
(5,  'Dashboard APIs all tested and deployed to staging.',
     'Full-stack integration of analytics dashboard.',
     NULL, '2026-08-18'),
(6,  'All 5 chart components done. Dashboard integration in progress.',
     'Connect charts to real API data.',
     NULL, '2026-08-18'),
(7,  'Redis cache on dashboard queries — 70% faster response time.',
     'Profile performance on production-like dataset.',
     NULL, '2026-08-18'),
(8,  'Customer arrival notification done.',
     'Stripe payment integration research.',
     NULL, '2026-08-18'),
(9,  'Chart design variants done.',
     'Design export flow and scheduled reports UI.',
     NULL, '2026-08-18'),
(10, 'Drag-and-drop file upload done. PR in review.',
     'Fix tooltip positioning bug on data table.',
     NULL, '2026-08-18'),
(11, 'Route polyline on map done.',
     'Implement ETA calculation display.',
     NULL, '2026-08-18'),
(12, 'Data table with sort and pagination done.',
     'Build reusable modal component.',
     NULL, '2026-08-18'),
(13, 'Export flow and scheduled reports UI done.',
     'Design dark mode tokens for analytics dashboard.',
     NULL, '2026-08-18'),
(14, '404 and error page illustrations done.',
     'Assist Apekshya with dark mode token mapping.',
     NULL, '2026-08-18'),

-- 2026-08-25 (Tuesday)
(5,  'Analytics dashboard v1 live on staging. Shared demo link with founders.',
     'Gather feedback, fix 3 reported issues.',
     NULL, '2026-08-25'),
(6,  'Dashboard fully connected to live APIs. All charts rendering correctly.',
     'Fix mobile responsiveness issues on dashboard.',
     NULL, '2026-08-25'),
(7,  'Dashboard performance profiling done — all queries under 200ms.',
     'Write load test for dashboard APIs.',
     NULL, '2026-08-25'),
(8,  'Stripe payment integration — test mode working.',
     'Implement order receipt generation.',
     NULL, '2026-08-25'),
(9,  'Dark mode tokens done. Export and scheduled reports screens finalised.',
     'Hand off analytics dashboard designs to Rama.',
     NULL, '2026-08-25'),
(10, 'Tooltip bug fixed. PR merged.',
     'Help Prem with modal component API design.',
     NULL, '2026-08-25'),
(11, 'ETA calculation display done.',
     'Add live traffic overlay on map.',
     NULL, '2026-08-25'),
(12, 'Modal component done and added to design system.',
     'Build toast notification component.',
     NULL, '2026-08-25'),

-- ══════════════ SEPTEMBER 2026 ══════════════

-- 2026-09-01 (Tuesday)
(5,  'Analytics dashboard founder feedback incorporated. 3 fixes merged.',
     'Deploy analytics dashboard to production.',
     NULL, '2026-09-01'),
(6,  'Mobile responsiveness fixed on all dashboard breakpoints.',
     'Start export feature frontend.',
     NULL, '2026-09-01'),
(7,  'Load tests for dashboard APIs — all passing at 200 concurrent users.',
     'Start MCP server research and planning.',
     NULL, '2026-09-01'),
(8,  'Order receipt generation done.',
     'Stripe live mode integration and testing.',
     NULL, '2026-09-01'),
(9,  'Analytics dashboard design handoff done.',
     'Start KPI widget library — additional widget types.',
     NULL, '2026-09-01'),
(10, 'Helped Prem with modal API. Component done.',
     'Start intern final project: employee competency matrix feature.',
     NULL, '2026-09-01'),
(11, 'Traffic overlay on map done.',
     'Implement multi-stop delivery route planning.',
     NULL, '2026-09-01'),
(12, 'Toast notification component done.',
     'Build date picker component.',
     NULL, '2026-09-01'),
(13, 'KPI widget additional types designed — gauge, sparkline, progress bar.',
     'Design data table empty states and filter states.',
     NULL, '2026-09-01'),
(14, 'Assisted with KPI widget designs.',
     'Design confetti / success animations for order completion.',
     NULL, '2026-09-01'),

-- 2026-09-08 (Tuesday)
(5,  'Analytics dashboard deployed to production. Stable.',
     'MCP server architecture planning with Prayash.',
     NULL, '2026-09-08'),
(6,  'Export feature — CSV export done. PDF in progress.',
     'Complete PDF export using browser print API.',
     NULL, '2026-09-08'),
(7,  'MCP server spike — read Claude MCP SDK docs. Wrote architecture proposal.',
     'Review proposal with Kshitiz.',
     NULL, '2026-09-08'),
(8,  'Stripe live mode integration done. Processing real payments on staging.',
     'Full end-to-end payment flow testing.',
     NULL, '2026-09-08'),
(9,  'Gauge, sparkline, progress bar widget designs done.',
     'Design onboarding wizard for new client dashboard setup.',
     NULL, '2026-09-08'),
(10, 'Competency matrix — data model and seed data designed.',
     'Implement competency matrix API with Prayash''s guidance.',
     NULL, '2026-09-08'),
(11, 'Multi-stop route planning done.',
     'Add offline fallback for route calculation.',
     NULL, '2026-09-08'),
(12, 'Date picker component done.',
     'Build searchable select / combobox component.',
     NULL, '2026-09-08'),

-- 2026-09-15 (Tuesday)
(5,  'MCP architecture reviewed and approved. Kicked off development.',
     'Scaffold MCP server repo. Set up SDK and auth module.',
     NULL, '2026-09-15'),
(6,  'PDF export done. Export feature PR submitted.',
     'Scheduled reports — frontend UI.',
     NULL, '2026-09-15'),
(7,  'MCP server scaffolded with Kshitiz. Auth module done.',
     'Write employees tool module for MCP.',
     NULL, '2026-09-15'),
(8,  'End-to-end payment flow tested and signed off.',
     'Driver earnings dashboard — backend API.',
     NULL, '2026-09-15'),
(9,  'Client dashboard onboarding wizard designs done.',
     'Start Q4 design system token refresh.',
     NULL, '2026-09-15'),
(10, 'Competency matrix API in progress with Prayash.',
     'Build frontend table for competency matrix.',
     NULL, '2026-09-15'),
(11, 'Offline route fallback done.',
     'Add ETA recalculation on route deviation.',
     NULL, '2026-09-15'),
(12, 'Searchable combobox done.',
     'Build rich text editor component for policy content.',
     NULL, '2026-09-15'),
(13, 'Q4 design token refresh started — colour palette updated.',
     'Update typography tokens and spacing scale.',
     NULL, '2026-09-15'),
(14, 'Confetti / success animations done.',
     'Design onboarding checklist component.',
     NULL, '2026-09-15'),

-- 2026-09-22 (Tuesday)
(5,  'MCP employees and leave tool modules done.',
     'Write standup and projects tool modules.',
     NULL, '2026-09-22'),
(6,  'Scheduled reports UI done. Backend integration in progress.',
     'Complete scheduled reports backend integration.',
     NULL, '2026-09-22'),
(7,  'MCP leave tool module done. Tested with MCP Inspector.',
     'Write projects and milestones tool module.',
     NULL, '2026-09-22'),
(8,  'Driver earnings dashboard API done.',
     'Build driver earnings dashboard frontend.',
     NULL, '2026-09-22'),
(9,  'Q4 design token refresh done. Published updated Figma library.',
     'Start analytics export feature UI — Q4 wireframes.',
     NULL, '2026-09-22'),
(10, 'Competency matrix feature — API + frontend done. PR submitted.',
     'Prepare final intern presentation for mid-term review.',
     NULL, '2026-09-22'),
(11, 'ETA recalculation on route deviation done.',
     'Implement order cancellation flow.',
     NULL, '2026-09-22'),
(12, 'Rich text editor component done.',
     'Build tag input component.',
     NULL, '2026-09-22'),
(13, 'Typography and spacing tokens updated. Figma library published.',
     'Design analytics export feature — PDF and CSV previews.',
     NULL, '2026-09-22'),
(14, 'Onboarding checklist component design done.',
     'Design driver badge and rating UI.',
     NULL, '2026-09-22'),

-- ══════════════ 2025 HISTORICAL SAMPLES ══════════════

-- 2025-11-14 (Friday)
(5,  'Built compensation history API and added Swagger docs.',
     'Write migration for normalization phase 3.',
     NULL, '2025-11-14'),
(6,  'Implemented employee profile edit form with validation.',
     'Work on leave balance display component.',
     'Waiting for API schema from Prayash.', '2025-11-14'),
(7,  'Fixed N+1 query issue on project assignments endpoint.',
     'Add Redis caching for employee list queries.',
     NULL, '2025-11-14'),
(8,  'Completed leave request mobile screen.',
     'Add offline sync for leave requests.',
     NULL, '2025-11-14'),
(9,  'Delivered mobile app screen designs (all 8 screens).',
     'Start web dashboard wireframes.',
     NULL, '2025-11-14'),

-- 2025-12-05 (Friday)
(5,  'Reviewed and merged 4 PRs. Set up staging server.',
     'Deploy v1.2 to production.',
     NULL, '2025-12-05'),
(6,  'Completed leave calendar view.',
     'Start payroll summary UI.',
     NULL, '2025-12-05'),
(7,  'Deployed leave approval notifications.',
     'Start monthly payroll report generation API.',
     NULL, '2025-12-05'),
(8,  'Implemented payslip PDF generation for mobile.',
     'Add swipe gesture for mobile leave request approval.',
     NULL, '2025-12-05'),
(9,  'Designed payroll module UI screens.',
     'Start holiday calendar page designs.',
     NULL, '2025-12-05');

-- ─────────────────────────────────────────────────────────────
--  VERIFY (FULL)
-- ─────────────────────────────────────────────────────────────

SELECT 'Employees'              AS entity, COUNT(*) AS total FROM employees;
SELECT 'Departments'            AS entity, COUNT(*) AS total FROM departments;
SELECT 'Designations'           AS entity, COUNT(*) AS total FROM designations;
SELECT 'Leave requests'         AS entity, COUNT(*) AS total FROM leave_requests;
SELECT 'Leave balances'         AS entity, COUNT(*) AS total FROM leave_balances;
SELECT 'Standups'               AS entity, COUNT(*) AS total FROM standups;
SELECT 'Projects'               AS entity, COUNT(*) AS total FROM projects;
SELECT 'Project todos'          AS entity, COUNT(*) AS total FROM project_todos;
SELECT 'Project services'       AS entity, COUNT(*) AS total FROM project_services;
SELECT 'Milestones'             AS entity, COUNT(*) AS total FROM milestones;
SELECT 'Meetings'               AS entity, COUNT(*) AS total FROM meetings;
SELECT 'Goals'                  AS entity, COUNT(*) AS total FROM goals;
SELECT 'Performance reviews'    AS entity, COUNT(*) AS total FROM performance_reviews;
SELECT 'Culture events'         AS entity, COUNT(*) AS total FROM culture_events;
SELECT 'Holidays'               AS entity, COUNT(*) AS total FROM holidays;
SELECT 'Weekly reports'         AS entity, COUNT(*) AS total FROM weekly_reports;
SELECT 'Monthly reports'        AS entity, COUNT(*) AS total FROM monthly_reports;
SELECT 'Service credentials'    AS entity, COUNT(*) AS total FROM service_credentials;
SELECT 'Employee documents'     AS entity, COUNT(*) AS total FROM employee_documents;
SELECT 'Policy acknowledgements'AS entity, COUNT(*) AS total FROM policy_acknowledgements;
SELECT 'Email settings'         AS entity, COUNT(*) AS total FROM email_settings;
SELECT 'Servers'                AS entity, COUNT(*) AS total FROM servers;
SELECT 'Overtime requests'      AS entity, COUNT(*) AS total FROM overtime_requests;
SELECT 'Payroll adjustments'    AS entity, COUNT(*) AS total FROM payroll_adjustments;
SELECT 'Tax profiles'           AS entity, COUNT(*) AS total FROM employee_tax_profiles;
SELECT 'Compensation history'   AS entity, COUNT(*) AS total FROM employee_compensation_history;
SELECT 'Pending leaves'         AS entity, COUNT(*) AS total FROM leave_requests WHERE status='pending';
SELECT 'Pending OT'             AS entity, COUNT(*) AS total FROM overtime_requests WHERE status='pending';
SELECT 'Active employees'       AS entity, COUNT(*) AS total FROM employees WHERE status='active';
SELECT 'Interns'                AS entity, COUNT(*) AS total FROM employees WHERE role='intern';
