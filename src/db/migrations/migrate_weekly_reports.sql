CREATE TABLE IF NOT EXISTS weekly_reports (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  employee_id     INT NOT NULL,
  title           VARCHAR(255) NOT NULL,
  week_start_date DATE NOT NULL,   -- Monday of the reporting week; also the folder name (YYYY-MM-DD)
  file_name       VARCHAR(255) NOT NULL,
  file_path       VARCHAR(500) NOT NULL,
  file_size       INT,
  notes           TEXT,
  submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
