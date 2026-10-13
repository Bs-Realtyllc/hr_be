USE hr_platform;

ALTER TABLE employees
  ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN two_factor_secret VARCHAR(255) NULL,
  ADD COLUMN two_factor_backup_codes JSON NULL;

CREATE TABLE IF NOT EXISTS two_factor_email_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_two_factor_email_tokens_employee (employee_id)
);

CREATE TABLE IF NOT EXISTS trusted_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_trusted_devices_token_hash (token_hash),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_trusted_devices_employee (employee_id)
);
