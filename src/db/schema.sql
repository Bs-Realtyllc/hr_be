CREATE DATABASE IF NOT EXISTS hr_platform;
USE hr_platform;

CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  emergency_contact VARCHAR(150),
  profile_picture VARCHAR(255),
  designation VARCHAR(100),
  department VARCHAR(100),
  manager_id INT,
  start_date DATE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  work_hours VARCHAR(50) DEFAULT '9 AM - 5 PM',
  tech_stack JSON,
  role ENUM('admin', 'lead', 'employee') DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type ENUM('casual', 'sick', 'annual') NOT NULL,
  total INT DEFAULT 0,
  taken INT DEFAULT 0,
  year YEAR NOT NULL,
  UNIQUE KEY unique_balance (employee_id, leave_type, year),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type ENUM('casual', 'sick', 'annual') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS standups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  yesterday TEXT,
  today TEXT,
  blockers TEXT,
  standup_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  repo_url VARCHAR(255),
  docs_url VARCHAR(255),
  status ENUM('active', 'archived', 'on_hold') DEFAULT 'active',
  start_date DATE,
  expected_end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  employee_id INT NOT NULL,
  role ENUM('lead', 'backend', 'frontend', 'ui_ux', 'qa', 'devops') NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_assignment (project_id, employee_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS milestones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS servers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT,
  name VARCHAR(100) NOT NULL,
  environment ENUM('development', 'staging', 'production') NOT NULL,
  ip_address VARCHAR(45),
  domain VARCHAR(255),
  ssh_user VARCHAR(100),
  notes TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS culture_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  event_type ENUM('birthday', 'anniversary', 'team_event', 'milestone') NOT NULL,
  employee_id INT,
  event_date DATE NOT NULL,
  description TEXT,
  slack_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Seed: default leave balances trigger after employee insert
-- Run manually or via app logic
