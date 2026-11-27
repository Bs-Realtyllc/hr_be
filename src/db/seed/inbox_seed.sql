-- Default inbox categories and channels (matches dev).
-- Safe to re-run: skips if categories/channels already exist by name.

INSERT INTO inbox_categories (name, position)
SELECT * FROM (SELECT 'Text Channels' AS name, 0 AS position) t
WHERE NOT EXISTS (SELECT 1 FROM inbox_categories WHERE name = 'Text Channels');

INSERT INTO inbox_categories (name, position)
SELECT * FROM (SELECT 'Voice Channels' AS name, 1 AS position) t
WHERE NOT EXISTS (SELECT 1 FROM inbox_categories WHERE name = 'Voice Channels');

SET @text_cat  = (SELECT id FROM inbox_categories WHERE name = 'Text Channels'  ORDER BY id LIMIT 1);
SET @voice_cat = (SELECT id FROM inbox_categories WHERE name = 'Voice Channels' ORDER BY id LIMIT 1);

INSERT INTO inbox_channels (name, type, category, category_id, description, position)
SELECT s.name, s.type, s.category, s.category_id, s.description, s.position
FROM (
  SELECT 'general'       AS name, 'text'         AS type, 'text'  AS category, @text_cat  AS category_id, 'Company-wide conversation and news' AS description, 0 AS position
  UNION ALL SELECT 'announcements', 'announcement', 'text',  @text_cat,  'Official company announcements', 1
  UNION ALL SELECT 'hr-updates',    'text',         'text',  @text_cat,  'HR policy and process updates',  2
  UNION ALL SELECT 'projects',      'text',         'text',  @text_cat,  'Project discussions',            3
  UNION ALL SELECT 'random',        'text',         'text',  @text_cat,  'Anything goes',                  4
  UNION ALL SELECT 'off-topic',     'text',         'text',  @text_cat,  'Non-work chatter',               5
  UNION ALL SELECT 'General',       'voice',        'voice', @voice_cat, NULL,                             0
  UNION ALL SELECT 'Team Standup',  'voice',        'voice', @voice_cat, NULL,                             1
  UNION ALL SELECT 'Quick Sync',    'voice',        'voice', @voice_cat, NULL,                             2
) s
WHERE NOT EXISTS (
  SELECT 1 FROM inbox_channels c WHERE c.name = s.name AND c.type = s.type
);
