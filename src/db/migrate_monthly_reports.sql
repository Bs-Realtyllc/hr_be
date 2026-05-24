CREATE TABLE IF NOT EXISTS monthly_reports (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  month       TINYINT NOT NULL,   -- 1–12
  year        SMALLINT NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  file_size   INT,
  notes       TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
