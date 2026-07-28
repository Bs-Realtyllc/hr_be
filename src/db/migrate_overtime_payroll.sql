-- Overtime requests + payroll adjustment ledger.
--   * overtime_requests: employee-submitted overtime claims (project, reason, who pre-approved it,
--     hours worked), reviewed by admin/lead like leave_requests.
--   * payroll_adjustments: a running ledger of pay additions/deductions (overtime pay, leave-balance
--     deductions, year-end leave bonuses) — computed via backend/src/pkg/payrollCalculator.js.

CREATE TABLE IF NOT EXISTS overtime_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  project_id INT NULL,
  work_date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  reason TEXT NOT NULL,
  approved_by_name VARCHAR(150) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  hourly_rate DECIMAL(12,2) NULL,
  overtime_rate DECIMAL(12,2) NULL,
  amount DECIMAL(12,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payroll_adjustments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  type ENUM('overtime_pay', 'leave_deduction', 'leave_bonus') NOT NULL,
  title VARCHAR(150) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  year YEAR NOT NULL,
  month TINYINT NULL,
  reference_type ENUM('overtime_request', 'leave_request') NULL,
  reference_id INT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
