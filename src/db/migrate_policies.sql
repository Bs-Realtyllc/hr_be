-- Policies feature: admin publishes documents (leave policy for now, more types later),
-- employees download, sign, and upload the signed copy; admin reviews and approves/rejects.

-- 1. Published policy documents. `type` is a free-form slug ('leave', etc.) rather than an
--    ENUM so new policy types don't require a migration.
CREATE TABLE IF NOT EXISTS policies (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  type         VARCHAR(50) NOT NULL,
  title        VARCHAR(200) NOT NULL,
  file_path    VARCHAR(255) NOT NULL,
  version      INT NOT NULL DEFAULT 1,
  uploaded_by  INT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- 2. Each employee's signed submission against a policy, and its review outcome.
CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  policy_id         INT NOT NULL,
  employee_id       INT NOT NULL,
  signed_file_path  VARCHAR(255) NOT NULL,
  status            ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason  TEXT NULL,
  submitted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by       INT NULL,
  reviewed_at       TIMESTAMP NULL,
  UNIQUE KEY unique_policy_employee (policy_id, employee_id),
  FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL
);
