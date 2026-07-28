-- Secondary email address for employees
ALTER TABLE employees
  ADD COLUMN secondary_email VARCHAR(150) NULL AFTER email;
