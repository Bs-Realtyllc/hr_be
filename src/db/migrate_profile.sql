-- Profile extended fields
ALTER TABLE employees
  ADD COLUMN dob DATE NULL AFTER emergency_contact,
  ADD COLUMN alt_phone VARCHAR(20) NULL AFTER phone,
  ADD COLUMN bio TEXT NULL AFTER dob,
  ADD COLUMN address TEXT NULL AFTER bio,
  ADD COLUMN qualifications JSON NULL AFTER tech_stack,
  ADD COLUMN citizenship_front VARCHAR(255) NULL AFTER profile_picture,
  ADD COLUMN citizenship_back VARCHAR(255) NULL AFTER citizenship_front;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
