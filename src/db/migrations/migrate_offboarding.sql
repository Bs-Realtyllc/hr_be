-- Offboarding workflow: a checklist-driven exit process per employee,
-- separate from the blunt status flip that `deactivate()` used to do alone.

ALTER TABLE employees
  MODIFY COLUMN status ENUM('onboarding', 'active', 'on_leave', 'probation', 'offboarding', 'terminated') NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS employee_offboarding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_id INT NOT NULL,
  exit_type ENUM('resignation', 'termination', 'end_of_contract', 'non_renewal') NOT NULL,
  reason TEXT,
  notice_date DATE NOT NULL,
  last_working_day DATE NOT NULL,
  status ENUM('in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'in_progress',
  previous_status VARCHAR(20) NOT NULL,
  relieving_letter_path VARCHAR(255),
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  CONSTRAINT fk_employee_offboarding_emp FOREIGN KEY (emp_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_employee_offboarding_created_by FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT fk_employee_offboarding_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS employee_offboarding_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  offboarding_id INT NOT NULL,
  category ENUM('hr', 'it', 'finance', 'manager') NOT NULL,
  title VARCHAR(150) NOT NULL,
  status ENUM('pending', 'completed', 'not_applicable') NOT NULL DEFAULT 'pending',
  notes TEXT,
  completed_by INT NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  CONSTRAINT fk_employee_offboarding_tasks_offboarding FOREIGN KEY (offboarding_id) REFERENCES employee_offboarding(id) ON DELETE CASCADE,
  CONSTRAINT fk_employee_offboarding_tasks_completed_by FOREIGN KEY (completed_by) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX idx_employee_offboarding_emp_id ON employee_offboarding(emp_id);
CREATE INDEX idx_employee_offboarding_tasks_offboarding_id ON employee_offboarding_tasks(offboarding_id);
