-- Inbox v2 migration
-- Run after migrate_inbox.sql

-- Per-channel membership (controls who is in each channel, unread state)
CREATE TABLE IF NOT EXISTS inbox_channel_members (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  channel_id     INT NOT NULL,
  employee_id    INT NOT NULL,
  role           ENUM('admin','member','readonly') NOT NULL DEFAULT 'member',
  joined_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at   TIMESTAMP NULL,
  UNIQUE KEY uq_ch_member (channel_id, employee_id),
  INDEX idx_ch_member_emp (employee_id),
  FOREIGN KEY (channel_id)   REFERENCES inbox_channels(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id)  REFERENCES employees(id)       ON DELETE CASCADE
);

-- Per-channel notification preference per user
CREATE TABLE IF NOT EXISTS inbox_notification_prefs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  channel_id     INT NOT NULL,
  employee_id    INT NOT NULL,
  mode           ENUM('all','mentions','none') NOT NULL DEFAULT 'all',
  muted_until    TIMESTAMP NULL,
  UNIQUE KEY uq_notif_pref (channel_id, employee_id),
  FOREIGN KEY (channel_id)  REFERENCES inbox_channels(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)       ON DELETE CASCADE
);

-- Add required_role to channels so admins can restrict access
ALTER TABLE inbox_channels ADD COLUMN IF NOT EXISTS required_role ENUM('admin','lead','employee','intern') NOT NULL DEFAULT 'intern';
ALTER TABLE inbox_channels ADD COLUMN IF NOT EXISTS is_archived   TINYINT(1) NOT NULL DEFAULT 0;

-- Seed all existing employees into all existing channels as members
INSERT IGNORE INTO inbox_channel_members (channel_id, employee_id)
SELECT c.id, e.id
FROM inbox_channels c
CROSS JOIN employees e
WHERE e.status NOT IN ('terminated');
