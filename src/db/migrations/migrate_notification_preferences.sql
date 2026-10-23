
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  notification_type VARCHAR(64) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  created_by INT NULL,
  updated_by INT NULL,
  UNIQUE KEY uq_notification_preferences_employee_type (employee_id, notification_type),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_notification_preferences_employee (employee_id)
);
