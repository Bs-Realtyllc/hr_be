-- Inbox: text/voice/announcement channels
CREATE TABLE IF NOT EXISTS inbox_channels (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  type        ENUM('text','voice','announcement') NOT NULL DEFAULT 'text',
  category    ENUM('text','voice') NOT NULL DEFAULT 'text',
  description VARCHAR(500),
  position    INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by  INT,
  updated_by  INT
);

-- Channel messages
CREATE TABLE IF NOT EXISTS inbox_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  channel_id  INT NOT NULL,
  employee_id INT NOT NULL,
  content     TEXT NOT NULL,
  is_edited   TINYINT(1) NOT NULL DEFAULT 0,
  is_pinned   TINYINT(1) NOT NULL DEFAULT 0,
  reply_to_id INT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  FOREIGN KEY (channel_id)  REFERENCES inbox_channels(id)  ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)        ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES inbox_messages(id)   ON DELETE SET NULL
);

-- Per-message emoji reactions (one row per employee per emoji)
CREATE TABLE IF NOT EXISTS inbox_message_reactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  message_id  INT NOT NULL,
  employee_id INT NOT NULL,
  emoji       VARCHAR(12) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaction (message_id, employee_id, emoji),
  FOREIGN KEY (message_id)  REFERENCES inbox_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)      ON DELETE CASCADE
);

-- Direct messages between two employees
CREATE TABLE IF NOT EXISTS inbox_dm_messages (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  from_employee_id INT NOT NULL,
  to_employee_id   INT NOT NULL,
  content          TEXT NOT NULL,
  is_edited        TINYINT(1) NOT NULL DEFAULT 0,
  is_read          TINYINT(1) NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       DATETIME NULL,
  FOREIGN KEY (from_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (to_employee_id)   REFERENCES employees(id) ON DELETE CASCADE
);

-- Voice channel live presence (who is currently in a voice channel)
CREATE TABLE IF NOT EXISTS inbox_voice_presence (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  channel_id  INT NOT NULL,
  employee_id INT NOT NULL,
  joined_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_voice_presence (channel_id, employee_id),
  FOREIGN KEY (channel_id)  REFERENCES inbox_channels(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)      ON DELETE CASCADE
);

-- Per-employee online presence/status
CREATE TABLE IF NOT EXISTS inbox_presence (
  employee_id INT PRIMARY KEY,
  status      ENUM('online','away','dnd','offline') NOT NULL DEFAULT 'offline',
  last_seen   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Indexes for hot query paths
CREATE INDEX IF NOT EXISTS idx_inbox_msg_channel_created ON inbox_messages (channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inbox_msg_employee        ON inbox_messages (employee_id);
CREATE INDEX IF NOT EXISTS idx_inbox_dm_pair             ON inbox_dm_messages (from_employee_id, to_employee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inbox_dm_to               ON inbox_dm_messages (to_employee_id, is_read);

-- Seed default channels (idempotent via INSERT IGNORE)
INSERT IGNORE INTO inbox_channels (id, name, type, category, description, position) VALUES
  (1, 'general',       'text',         'text',  'Company-wide conversation and news',        1),
  (2, 'announcements', 'announcement', 'text',  'Important company announcements',           2),
  (3, 'hr-updates',    'text',         'text',  'HR policy updates and news',                3),
  (4, 'projects',      'text',         'text',  'Project discussions and updates',           4),
  (5, 'random',        'text',         'text',  'Off-topic chat and fun stuff',              5),
  (6, 'off-topic',     'text',         'text',  'Anything goes',                             6),
  (7, 'General',       'voice',        'voice', NULL,                                        7),
  (8, 'Team Standup',  'voice',        'voice', NULL,                                        8),
  (9, 'Quick Sync',    'voice',        'voice', NULL,                                        9);
