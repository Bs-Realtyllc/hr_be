
CREATE TABLE IF NOT EXISTS login_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NULL,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_login_history_employee_created (employee_id, created_at)
);
