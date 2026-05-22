-- Add discord_username to employees for reliable Discord → HR matching
ALTER TABLE employees
  ADD COLUMN discord_username VARCHAR(100) NULL AFTER phone,
  ADD UNIQUE KEY idx_discord_username (discord_username);
