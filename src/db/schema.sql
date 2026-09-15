CREATE DATABASE IF NOT EXISTS hr_platform;

USE hr_platform;

CREATE TABLE
  IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    gender ENUM ('male', 'female', 'other', 'prefer_not_to_say') NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    emergency_contact VARCHAR(150),
    profile_picture VARCHAR(255),
    designation VARCHAR(100),
    department VARCHAR(100),
    manager_id INT,
    start_date DATE,
    dob DATE NULL,
    github_url VARCHAR(255) NULL,
    address TEXT NULL,
    discord_username VARCHAR(100) NULL UNIQUE,
    panNo VARCHAR(50) NULL UNIQUE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    work_hours VARCHAR(50) DEFAULT '9 AM - 5 PM',
    tech_stack JSON,
    role ENUM ('admin', 'lead', 'employee', 'intern') NOT NULL DEFAULT 'employee',
    password_hash VARCHAR(255) NULL,
    salary DECIMAL(10, 2) NULL,
    pay_frequency ENUM ('monthly', 'biweekly', 'weekly') DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT TRUE,
    status ENUM (
      'onboarding',
      'active',
      'on_leave',
      'probation',
      'terminated'
    ) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES employees (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS leave_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type ENUM ('casual', 'sick', 'annual') NOT NULL,
    total INT DEFAULT 0,
    taken INT DEFAULT 0,
    year YEAR NOT NULL,
    UNIQUE KEY unique_balance (employee_id, leave_type, year),
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type ENUM ('casual', 'sick', 'annual') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM ('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES employees (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS standups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    workedOn TEXT,
    completed TEXT,
    inProgress TEXT,
    nextUp TEXT,
    blockers TEXT,
    links TEXT,
    standup_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    repo_url VARCHAR(255),
    docs_url VARCHAR(255),
    status ENUM ('active', 'archived', 'on_hold') DEFAULT 'active',
    start_date DATE,
    expected_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE
  IF NOT EXISTS project_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    employee_id INT NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'developer',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assignment (project_id, employee_id),
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS milestones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM ('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS project_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    service_key VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_project_service (project_id, service_key),
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS service_credentials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255),
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    UNIQUE KEY unique_employee_service (employee_id, service_name),
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES employees (id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES employees (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS servers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    name VARCHAR(100) NOT NULL,
    environment ENUM ('development', 'staging', 'production') NOT NULL,
    ip_address VARCHAR(45),
    domain VARCHAR(255),
    ssh_user VARCHAR(100),
    notes TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS culture_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    event_type ENUM (
      'birthday',
      'anniversary',
      'team_event',
      'milestone'
    ) NOT NULL,
    employee_id INT,
    event_date DATE NOT NULL,
    description TEXT,
    slack_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS employee_tax_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL UNIQUE,
    tax_id VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Nepal',
    filing_status ENUM ('single', 'married', 'head_of_household') DEFAULT 'single',
    tax_regime ENUM ('old', 'new') DEFAULT 'new',
    exemptions DECIMAL(12, 2) DEFAULT 0,
    additional_withholding DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM ('individual', 'team', 'company') DEFAULT 'individual',
    metric_unit VARCHAR(30) DEFAULT '%',
    target_value DECIMAL(12, 2) DEFAULT 100,
    current_value DECIMAL(12, 2) DEFAULT 0,
    weight INT DEFAULT 3,
    status ENUM (
      'not_started',
      'in_progress',
      'at_risk',
      'completed',
      'missed'
    ) DEFAULT 'not_started',
    start_date DATE,
    due_date DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES employees (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS performance_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    reviewer_id INT,
    review_period VARCHAR(20) NOT NULL,
    overall_rating DECIMAL(2, 1),
    category_ratings JSON,
    strengths TEXT,
    improvements TEXT,
    manager_comments TEXT,
    employee_comments TEXT,
    status ENUM ('draft', 'submitted', 'acknowledged') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_review_period (employee_id, review_period),
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES employees (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS feedback_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_employee_id INT NOT NULL,
    to_employee_id INT NOT NULL,
    feedback_type ENUM ('praise', 'constructive', 'peer', 'manager') DEFAULT 'praise',
    visibility ENUM ('public', 'private') DEFAULT 'public',
    message TEXT NOT NULL,
    project_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (to_employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS overtime_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    project_id INT NULL,
    work_date DATE NOT NULL,
    hours DECIMAL(4, 2) NOT NULL,
    reason TEXT NOT NULL,
    approved_by_name VARCHAR(150) NOT NULL,
    status ENUM ('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    hourly_rate DECIMAL(12, 2) NULL,
    overtime_rate DECIMAL(12, 2) NULL,
    amount DECIMAL(12, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES employees (id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS payroll_adjustments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    type ENUM ('overtime_pay', 'leave_deduction', 'leave_bonus') NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    year YEAR NOT NULL,
    month TINYINT NULL,
    reference_type ENUM ('overtime_request', 'leave_request') NULL,
    reference_id INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS forms_layout (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    data JSON NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    holiday_date DATE NOT NULL UNIQUE,
    year YEAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- Seed: default leave balances trigger after employee insert
-- Run manually or via app logic