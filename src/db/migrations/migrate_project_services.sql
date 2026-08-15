CREATE TABLE IF NOT EXISTS project_services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  service_key VARCHAR(50) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_project_service (project_id, service_key),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
