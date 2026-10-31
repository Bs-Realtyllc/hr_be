-- Dynamic categories
CREATE TABLE IF NOT EXISTS inbox_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  created_by  INT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default categories
INSERT IGNORE INTO inbox_categories (id, name, position) VALUES
  (1, 'Text Channels', 0),
  (2, 'Voice Channels', 1);

-- Add category_id and is_private to inbox_channels
ALTER TABLE inbox_channels ADD COLUMN IF NOT EXISTS category_id INT DEFAULT NULL;
ALTER TABLE inbox_channels ADD COLUMN IF NOT EXISTS is_private  TINYINT NOT NULL DEFAULT 0;

-- Migrate existing channels to default categories
UPDATE inbox_channels SET category_id = 1 WHERE type IN ('text', 'announcement') AND category_id IS NULL;
UPDATE inbox_channels SET category_id = 2 WHERE type = 'voice' AND category_id IS NULL;
