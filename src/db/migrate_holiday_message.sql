-- Adds a festive message to each holiday and seeds the official 2026 Nepali-calendar holiday list.

ALTER TABLE holidays ADD COLUMN message TEXT NULL AFTER name;

INSERT INTO holidays (name, holiday_date, year, message) VALUES
  ('New Year',         '2026-01-01', 2026, 'Happy New Year! Wishing you success, growth, and happiness in the year ahead. 🎆'),
  ('Holi',             '2026-03-02', 2026, 'Wishing you a joyful and colorful Holi. Enjoy the festival and take a refreshing break. 🌈'),
  ('Chaite Dashain',   '2026-03-26', 2026, 'May this Chaite Dashain bring positivity and new beginnings. 🌸'),
  ('Nepali New Year',  '2026-04-14', 2026, 'Wishing you a fresh start, new goals, and great success in the coming year. 🎊'),
  ('Buddha Jayanti',   '2026-05-01', 2026, 'May Lord Buddha''s teachings bring peace, wisdom, and harmony to your life. ☸️'),
  ('Janai Purnima',    '2026-08-28', 2026, 'Wishing you purity of thoughts and good health on Janai Purnima. 🙏'),
  ('Teej',             '2026-09-14', 2026, 'Wishing happiness, strength, and well-being on the occasion of Teej. 🌺'),
  ('Ghatasthapana',    '2026-10-11', 2026, 'Dashain begins! May this festive season bring joy and prosperity. 🪔'),
  ('Dashain Holiday',  '2026-10-18', 2026, 'Enjoy the festive time with family and loved ones. 🎉'),
  ('Dashain Holiday',  '2026-10-19', 2026, 'Wishing you continued joy and blessings during Dashain. 🎊'),
  ('Dashain Holiday',  '2026-10-20', 2026, 'May Dashain bring success, happiness, and good fortune. 🌸'),
  ('Vijaya Dashami',   '2026-10-21', 2026, 'Warm wishes on Bijaya Dashami. May victory and prosperity be yours. 🌼'),
  ('Tihar Holiday',    '2026-11-08', 2026, 'Tihar holidays begin. Wishing you light, happiness, and prosperity. 🪔'),
  ('Tihar Holiday',    '2026-11-09', 2026, 'May Goddess Laxmi bless you with wealth and happiness. 🏮'),
  ('Tihar Holiday',    '2026-11-10', 2026, 'Wishing joy and harmony on the festive days of Tihar. ✨'),
  ('Bhai Tika',        '2026-11-11', 2026, 'Warm wishes on Bhai Tika. May sibling bonds grow stronger. 💙'),
  ('Christmas',        '2026-12-25', 2026, 'Merry Christmas! Wishing you joy, peace, and warmth this festive season. 🎄'),
  ('Tamu Lhosar',      '2026-12-30', 2026, 'Happy Tamu Lhosar. Wishing prosperity, health, and happiness. 🎉')
ON DUPLICATE KEY UPDATE name = VALUES(name), year = VALUES(year), message = VALUES(message);
