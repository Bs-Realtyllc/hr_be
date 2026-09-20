-- ============================================================
--  GITGI Public Roadmap — Seed Data
--  Mirrors the NEAR_TERM array from app/about/roadmap/page.tsx
--  in the GITGI-Website-main repo (commit 218d33c0).
--
--  Progress is computed from project_todos: completed/total * 100.
--  Each project gets 20 todos with the right ratio.
--
--  Run after migrate_project_roadmap_fields.sql and
--  migrate_project_todos.sql have been applied.
-- ============================================================

USE hr_platform;

-- ─────────────────────────────────────────────────────────────
-- 1. PROJECTS  (roadmap-visible entries only)
-- ─────────────────────────────────────────────────────────────

INSERT INTO projects (name, description, status, roadmap_key, roadmap_label, public_link, start_date, expected_end_date)
VALUES
  -- 1. Job Search & Talent Hiring Platform  →  target 65%  (13/20 complete)
  (
    'Job Search & Talent Hiring Platform',
    'A public-facing platform connecting job seekers with opportunities across the GITGI ecosystem.',
    'active',
    'job-search-platform',
    'Due September 2026',
    NULL,
    '2026-01-01',
    '2026-09-30'
  ),

  -- 2. BSRealty  →  target 55%  (11/20 complete)
  (
    'BSRealty',
    'A-to-Z solutions for homeownership, finance, insurance & education. Real Estate, Mortgage, Insurance, Professional Education, Tax & Accounting, Home Improvement, all under one roof.',
    'active',
    'bsrealty',
    'Due September 2026',
    'https://bsrealtyllc.com/',
    '2025-10-01',
    '2026-09-30'
  ),

  -- 3. Personal & Commercial Insurance Solutions  →  target 50%  (10/20 complete)
  (
    'Personal & Commercial Insurance Solutions',
    'Protecting what matters most: auto, home, dwelling fire, workers'' compensation, and commercial insurance. One agency, all your coverage needs. Free quotes, no pressure. Includes a mobile app for policyholders.',
    'active',
    'insurance-solutions',
    'Due September 2026',
    'https://insurance.bsrealtyllc.com/',
    '2025-10-01',
    '2026-09-30'
  ),

  -- 4. LMS Phase I  →  target 40%  (8/20 complete)
  (
    'Learning Management Software (LMS for Private Lectures, Phase I)',
    'A learning management system with course catalog, private cohorts, quizzes, certificates, and admin controls for content and enrollment, plus a mobile app for students.',
    'active',
    'lms-phase-1',
    'Due September 2026',
    'https://education.bsrealtyllc.com/',
    '2026-01-01',
    '2026-09-30'
  ),

  -- 5. Stabilize & Public Beta Expansion  →  target 10%  (2/20 complete)
  (
    'Stabilize & Public Beta Expansion',
    'Security hardening, public-facing careers, improved search and recommendations, and payments.',
    'active',
    'public-beta-expansion',
    'Due September 2026',
    NULL,
    '2026-06-01',
    '2026-09-30'
  ),

  -- 6. Internal HR Platform  →  target 70%  (14/20 complete)
  (
    'Internal HR Platform',
    'An internal platform where all employees and interns handle official company work: policies, payroll, onboarding, and more, all in one place.',
    'active',
    'hr-platform',
    'Due September 2026',
    NULL,
    '2025-09-01',
    '2026-09-30'
  ),

  -- 7. Metrics Dashboard & Customer Case Studies  →  target 15%  (3/20 complete)
  (
    'Metrics Dashboard & Customer Case Studies',
    'A performance metrics dashboard, real customer case studies and testimonials, and a refreshed product roadmap demonstrating tangible traction across our platforms.',
    'active',
    'metrics-dashboard',
    'Due November 2026',
    NULL,
    '2026-07-01',
    '2026-11-30'
  );

-- ─────────────────────────────────────────────────────────────
-- 2. PROJECT TODOS
--    is_complete = 1 → done   |   0 → pending
--    Ratio drives the % shown on the roadmap card.
-- ─────────────────────────────────────────────────────────────

-- ── Job Search & Talent Hiring Platform  (13 done / 20 = 65%) ──
INSERT INTO project_todos (project_id, title, is_complete, sort_order)
SELECT p.id, t.title, t.is_complete, t.sort_order
FROM projects p,
(SELECT 'Define job seeker and recruiter personas'              AS title, 1 AS is_complete,  1 AS sort_order UNION ALL
 SELECT 'Finalize data model (jobs, applications, candidates)', 1,  2 UNION ALL
 SELECT 'Set up monorepo with Next.js + Express',               1,  3 UNION ALL
 SELECT 'Implement authentication (JWT + OAuth)',                1,  4 UNION ALL
 SELECT 'Build job listing and detail pages',                   1,  5 UNION ALL
 SELECT 'Candidate profile creation and resume upload',         1,  6 UNION ALL
 SELECT 'Job application flow (apply, track, withdraw)',        1,  7 UNION ALL
 SELECT 'Recruiter dashboard – post & manage listings',        1,  8 UNION ALL
 SELECT 'Search and filter engine (ElasticSearch/MySQL FTS)',   1,  9 UNION ALL
 SELECT 'Email notifications (application received / status)',  1, 10 UNION ALL
 SELECT 'Admin panel – approve listings, manage users',         1, 11 UNION ALL
 SELECT 'Analytics events instrumentation',                     1, 12 UNION ALL
 SELECT 'Mobile-responsive polish pass',                        1, 13 UNION ALL
 SELECT 'Recommended jobs algorithm (v1)',                      0, 14 UNION ALL
 SELECT 'Saved jobs and job alerts',                            0, 15 UNION ALL
 SELECT 'Recruiter applicant-tracking board (kanban)',          0, 16 UNION ALL
 SELECT 'In-app messaging (candidate ↔ recruiter)',             0, 17 UNION ALL
 SELECT 'Payments – promoted listings',                         0, 18 UNION ALL
 SELECT 'Accessibility audit (WCAG 2.1 AA)',                    0, 19 UNION ALL
 SELECT 'Load testing and performance hardening',               0, 20
) AS t
WHERE p.roadmap_key = 'job-search-platform';

-- ── BSRealty  (11 done / 20 = 55%) ──
INSERT INTO project_todos (project_id, title, is_complete, sort_order)
SELECT p.id, t.title, t.is_complete, t.sort_order
FROM projects p,
(SELECT 'Brand identity and design system' AS title,                      1 AS is_complete, 1 AS sort_order UNION ALL
 SELECT 'Property listing pages with MLS data integration',               1, 2 UNION ALL
 SELECT 'Mortgage calculator and loan pre-qual form',                     1, 3 UNION ALL
 SELECT 'Agent directory and contact routing',                            1, 4 UNION ALL
 SELECT 'Home-buyer journey landing pages',                               1, 5 UNION ALL
 SELECT 'CRM integration (HubSpot/Salesforce)',                           1, 6 UNION ALL
 SELECT 'Insurance product pages and quote request form',                 1, 7 UNION ALL
 SELECT 'Professional Education course catalog',                          1, 8 UNION ALL
 SELECT 'Tax & accounting service landing',                               1, 9 UNION ALL
 SELECT 'Blog / resource center (SEO)',                                   1, 10 UNION ALL
 SELECT 'Live chat and scheduling widget',                                1, 11 UNION ALL
 SELECT 'Home Improvement vendor directory',                              0, 12 UNION ALL
 SELECT 'Client portal (documents, signatures)',                          0, 13 UNION ALL
 SELECT 'Payment processing integration',                                 0, 14 UNION ALL
 SELECT 'Mobile app – iOS / Android',                                     0, 15 UNION ALL
 SELECT 'Testimonials and case-study section',                            0, 16 UNION ALL
 SELECT 'Multi-language support (Spanish)',                               0, 17 UNION ALL
 SELECT 'Automated drip email campaigns',                                 0, 18 UNION ALL
 SELECT 'Performance and Core Web Vitals optimisation',                   0, 19 UNION ALL
 SELECT 'Security pen-test and SOC 2 prep',                               0, 20
) AS t
WHERE p.roadmap_key = 'bsrealty';

-- ── Personal & Commercial Insurance Solutions  (10 done / 20 = 50%) ──
INSERT INTO project_todos (project_id, title, is_complete, sort_order)
SELECT p.id, t.title, t.is_complete, t.sort_order
FROM projects p,
(SELECT 'Product scope and line-of-business mapping' AS title,           1 AS is_complete,  1 AS sort_order UNION ALL
 SELECT 'Agency management system selection',                             1,  2 UNION ALL
 SELECT 'Auto insurance quote flow',                                      1,  3 UNION ALL
 SELECT 'Home and dwelling fire quote flow',                              1,  4 UNION ALL
 SELECT 'Workers'' comp quote flow',                                      1,  5 UNION ALL
 SELECT 'Commercial BOP (Business Owner Policy) flow',                    1,  6 UNION ALL
 SELECT 'Carrier API integrations (v1)',                                  1,  7 UNION ALL
 SELECT 'Agent portal – bind and service policies',                       1,  8 UNION ALL
 SELECT 'Policyholder account and document download',                     1,  9 UNION ALL
 SELECT 'Claims reporting flow',                                          1, 10 UNION ALL
 SELECT 'Mobile app skeleton (React Native)',                             0, 11 UNION ALL
 SELECT 'Push notifications – renewal reminders',                         0, 12 UNION ALL
 SELECT 'E-signature for policy documents',                                0, 13 UNION ALL
 SELECT 'Premium payment and auto-pay integration',                       0, 14 UNION ALL
 SELECT 'Multi-carrier comparison engine',                                0, 15 UNION ALL
 SELECT 'State compliance review (50-state rollout)',                     0, 16 UNION ALL
 SELECT 'Commercial umbrella and excess lines',                           0, 17 UNION ALL
 SELECT 'Partner broker portal',                                          0, 18 UNION ALL
 SELECT 'Analytics dashboard for leadership',                             0, 19 UNION ALL
 SELECT 'Accessibility and UX audit',                                     0, 20
) AS t
WHERE p.roadmap_key = 'insurance-solutions';

-- ── LMS Phase I  (8 done / 20 = 40%) ──
INSERT INTO project_todos (project_id, title, is_complete, sort_order)
SELECT p.id, t.title, t.is_complete, t.sort_order
FROM projects p,
(SELECT 'LMS platform architecture design' AS title,                     1 AS is_complete,  1 AS sort_order UNION ALL
 SELECT 'Admin: create and manage courses',                               1,  2 UNION ALL
 SELECT 'Instructor video upload and transcript generation',              1,  3 UNION ALL
 SELECT 'Student enrolment and cohort management',                        1,  4 UNION ALL
 SELECT 'Lesson player (video + PDF + quiz)',                             1,  5 UNION ALL
 SELECT 'Quiz builder with scoring',                                      1,  6 UNION ALL
 SELECT 'Certificate generation (PDF)',                                   1,  7 UNION ALL
 SELECT 'Payment gateway for course purchase',                            1,  8 UNION ALL
 SELECT 'Student progress tracking dashboard',                            0,  9 UNION ALL
 SELECT 'Discussion forums per course',                                   0, 10 UNION ALL
 SELECT 'Live session scheduling (Zoom / Meet integration)',              0, 11 UNION ALL
 SELECT 'Mobile app – iOS (student)',                                     0, 12 UNION ALL
 SELECT 'Mobile app – Android (student)',                                 0, 13 UNION ALL
 SELECT 'Gamification – badges and streaks',                              0, 14 UNION ALL
 SELECT 'Admin analytics (completion rates, drop-off)',                   0, 15 UNION ALL
 SELECT 'SCORM / xAPI import support',                                    0, 16 UNION ALL
 SELECT 'Accessibility audit (WCAG 2.1 AA)',                              0, 17 UNION ALL
 SELECT 'Multi-language content support',                                 0, 18 UNION ALL
 SELECT 'Subscription plan and pricing tiers',                            0, 19 UNION ALL
 SELECT 'Performance load-testing (10 k concurrent students)',           0, 20
) AS t
WHERE p.roadmap_key = 'lms-phase-1';

-- ── Stabilize & Public Beta Expansion  (2 done / 20 = 10%) ──
INSERT INTO project_todos (project_id, title, is_complete, sort_order)
SELECT p.id, t.title, t.is_complete, t.sort_order
FROM projects p,
(SELECT 'Threat-model review and initial hardening' AS title,            1 AS is_complete,  1 AS sort_order UNION ALL
 SELECT 'Dependency audit and CVE patching',                              1,  2 UNION ALL
 SELECT 'Public-facing /careers page MVP',                                0,  3 UNION ALL
 SELECT 'Search relevance improvements (BM25 tuning)',                    0,  4 UNION ALL
 SELECT 'Recommendation engine v2',                                       0,  5 UNION ALL
 SELECT 'Stripe / payment gateway integration',                           0,  6 UNION ALL
 SELECT 'Rate limiting and bot protection (Cloudflare)',                  0,  7 UNION ALL
 SELECT 'WAF rules and OWASP Top-10 remediation',                         0,  8 UNION ALL
 SELECT 'Penetration test (third-party)',                                  0,  9 UNION ALL
 SELECT 'GDPR / CCPA compliance review',                                  0, 10 UNION ALL
 SELECT 'Cookie consent banner and preferences',                           0, 11 UNION ALL
 SELECT 'Staging → production deployment automation (CI/CD)',             0, 12 UNION ALL
 SELECT 'Error monitoring (Sentry) tuning',                               0, 13 UNION ALL
 SELECT 'Uptime SLA monitoring (99.9 %)',                                 0, 14 UNION ALL
 SELECT 'Data backup and disaster recovery runbook',                      0, 15 UNION ALL
 SELECT 'Beta user onboarding email sequence',                            0, 16 UNION ALL
 SELECT 'Public beta invite system',                                      0, 17 UNION ALL
 SELECT 'In-app feedback widget',                                         0, 18 UNION ALL
 SELECT 'NPS survey (60-day post sign-up)',                               0, 19 UNION ALL
 SELECT 'Beta exit report – learnings and next sprint plan',              0, 20
) AS t
WHERE p.roadmap_key = 'public-beta-expansion';

-- ── Internal HR Platform  (14 done / 20 = 70%) ──
INSERT INTO project_todos (project_id, title, is_complete, sort_order)
SELECT p.id, t.title, t.is_complete, t.sort_order
FROM projects p,
(SELECT 'Employee directory and profile management' AS title,            1 AS is_complete,  1 AS sort_order UNION ALL
 SELECT 'Authentication (JWT + role-based access)',                      1,  2 UNION ALL
 SELECT 'Onboarding workflow and document checklist',                    1,  3 UNION ALL
 SELECT 'Leave management (request, approve, balance)',                  1,  4 UNION ALL
 SELECT 'Daily standup logging',                                          1,  5 UNION ALL
 SELECT 'Project and assignment tracking',                                1,  6 UNION ALL
 SELECT 'Payroll overview and adjustment records',                        1,  7 UNION ALL
 SELECT 'Performance goals and OKR tracking',                             1,  8 UNION ALL
 SELECT 'Peer feedback and 360-degree reviews',                           1,  9 UNION ALL
 SELECT 'Policy management and e-acknowledgement',                       1, 10 UNION ALL
 SELECT 'Holiday calendar management',                                    1, 11 UNION ALL
 SELECT 'Service credentials vault',                                      1, 12 UNION ALL
 SELECT 'Server and infrastructure registry',                             1, 13 UNION ALL
 SELECT 'Culture events feed (birthdays, anniversaries)',                 1, 14 UNION ALL
 SELECT 'Overtime request and approval flow',                             0, 15 UNION ALL
 SELECT 'Monthly payroll report generation',                              0, 16 UNION ALL
 SELECT 'Public roadmap API + website integration',                       0, 17 UNION ALL
 SELECT 'Slack notifications integration',                                0, 18 UNION ALL
 SELECT 'Mobile-responsive admin UI polish',                              0, 19 UNION ALL
 SELECT 'SOC 2 audit trail and access logging',                           0, 20
) AS t
WHERE p.roadmap_key = 'hr-platform';

-- ── Metrics Dashboard & Customer Case Studies  (3 done / 20 = 15%) ──
INSERT INTO project_todos (project_id, title, is_complete, sort_order)
SELECT p.id, t.title, t.is_complete, t.sort_order
FROM projects p,
(SELECT 'Define KPIs and data sources across platforms' AS title,        1 AS is_complete,  1 AS sort_order UNION ALL
 SELECT 'Data pipeline design (ETL to analytics DB)',                     1,  2 UNION ALL
 SELECT 'Dashboard wireframes approved by leadership',                    1,  3 UNION ALL
 SELECT 'Connect first data source (HR Platform metrics)',                0,  4 UNION ALL
 SELECT 'Connect BSRealty lead funnel data',                              0,  5 UNION ALL
 SELECT 'Connect insurance quote-to-bind metrics',                        0,  6 UNION ALL
 SELECT 'Connect LMS student engagement data',                            0,  7 UNION ALL
 SELECT 'Connect job-platform application metrics',                       0,  8 UNION ALL
 SELECT 'Build overview dashboard (React + Recharts)',                    0,  9 UNION ALL
 SELECT 'Build per-product drill-down panels',                            0, 10 UNION ALL
 SELECT 'Customer case study #1 – BSRealty client',                      0, 11 UNION ALL
 SELECT 'Customer case study #2 – Insurance policyholder',               0, 12 UNION ALL
 SELECT 'Customer case study #3 – LMS graduate',                         0, 13 UNION ALL
 SELECT 'Testimonials collection and editorial review',                   0, 14 UNION ALL
 SELECT 'Video testimonials (3 clients recorded)',                        0, 15 UNION ALL
 SELECT 'Publish case studies to GITGI website',                          0, 16 UNION ALL
 SELECT 'Refreshed public roadmap page with real data',                   0, 17 UNION ALL
 SELECT 'Investor-ready metrics one-pager (PDF export)',                  0, 18 UNION ALL
 SELECT 'Quarterly board report template',                                0, 19 UNION ALL
 SELECT 'Automated weekly metrics email digest',                          0, 20
) AS t
WHERE p.roadmap_key = 'metrics-dashboard';
