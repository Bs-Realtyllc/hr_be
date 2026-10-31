-- Inbox v4: saved messages table + reply_to fields on messages

CREATE TABLE IF NOT EXISTS inbox_saved_messages (
  id          INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  message_id  INT NOT NULL,
  saved_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employee_message (employee_id, message_id),
  KEY idx_employee_saved (employee_id),
  KEY idx_message_saved (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- reply_to fields on inbox_messages (in case not yet added)
ALTER TABLE inbox_messages
  ADD COLUMN IF NOT EXISTS reply_to_id      INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reply_to_content VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reply_to_author  VARCHAR(100) DEFAULT NULL;
