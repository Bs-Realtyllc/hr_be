-- Leave policy overhaul (2026):
--   * 'casual'/'annual' leave types are retired in favor of 'sick', 'bereavement', 'maternity', 'paternity'
--   * new company-wide fixed-holiday calendar (18 paid Nepali-calendar holidays/year)

-- 1. Company holidays — shared calendar, not tied to any one employee.
CREATE TABLE IF NOT EXISTS holidays (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(150) NOT NULL,
  holiday_date DATE NOT NULL,
  year         YEAR NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_holiday_date (holiday_date)
);

-- 2. leave_requests keeps 'casual'/'annual' in its enum so historical rows stay valid,
--    but the app no longer offers them for new requests — only the four new categories.
ALTER TABLE leave_requests
  MODIFY COLUMN leave_type ENUM('sick', 'bereavement', 'maternity', 'paternity', 'casual', 'annual') NOT NULL;

-- 3. leave_balances is a current-entitlement cache (not an audit trail) — obsolete
--    casual/annual allotments are dropped outright and the enum tightened to match.
DELETE FROM leave_balances WHERE leave_type IN ('casual', 'annual');

ALTER TABLE leave_balances
  MODIFY COLUMN leave_type ENUM('sick', 'bereavement', 'maternity', 'paternity') NOT NULL;

-- 4. Bring existing sick-leave rows up to the new 12/year allotment.
UPDATE leave_balances SET total = 12 WHERE leave_type = 'sick' AND year = YEAR(CURDATE());

-- 5. Seed the new leave categories for every active employee for the current year.
INSERT IGNORE INTO leave_balances (employee_id, leave_type, total, taken, year)
SELECT id, 'sick', 12, 0, YEAR(CURDATE()) FROM employees WHERE is_active = TRUE
UNION ALL
SELECT id, 'bereavement', 3, 0, YEAR(CURDATE()) FROM employees WHERE is_active = TRUE
UNION ALL
SELECT id, 'maternity', 60, 0, YEAR(CURDATE()) FROM employees WHERE is_active = TRUE
UNION ALL
SELECT id, 'paternity', 30, 0, YEAR(CURDATE()) FROM employees WHERE is_active = TRUE;
