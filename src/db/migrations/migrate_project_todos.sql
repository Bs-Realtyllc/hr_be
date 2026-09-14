USE hr_platform;

CREATE TABLE IF NOT EXISTS project_todos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  deadline DATE,
  is_complete TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL
);
