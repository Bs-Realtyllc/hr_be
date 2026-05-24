-- Per-employee email configuration for leave notifications
CREATE TABLE IF NOT EXISTS email_settings (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  employee_id  INT NOT NULL UNIQUE,
  smtp_host    VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
  smtp_port    INT          NOT NULL DEFAULT 587,
  smtp_user    VARCHAR(255) NOT NULL,
  smtp_pass    VARCHAR(255) NOT NULL,
  smtp_from    VARCHAR(255),          -- display "From" address, defaults to smtp_user
  default_to   TEXT,                  -- comma-separated default recipients
  default_cc   TEXT,
  default_bcc  TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
