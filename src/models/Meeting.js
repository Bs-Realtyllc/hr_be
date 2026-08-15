const db = require('../db');

exports.findUpcomingScheduled = async () => {
  const [rows] = await db.query(
    `SELECT m.*, e.name AS creator_name
     FROM meetings m
     LEFT JOIN employees_flat e ON m.created_by = e.id
     WHERE m.status = 'scheduled'
       AND m.start_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY m.start_datetime ASC`
  );
  return rows;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO meetings (title, description, start_datetime, end_datetime, attendees, google_event_id, meet_link, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.description, data.start_datetime, data.end_datetime,
     JSON.stringify(data.attendees || []), data.google_event_id, data.meet_link, data.created_by]
  );
  return result.insertId;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM meetings WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.cancel = async (id) => {
  await db.query(`UPDATE meetings SET status = 'cancelled' WHERE id = ?`, [id]);
};

// Shared upsert used by both the manual /sync endpoint and the Google push-notification webhook.
// `attendees` must already be a JSON string (see googleController's event-shaping helper).
exports.upsertFromGoogleEvent = async ({ title, description, start_datetime, end_datetime, attendees, google_event_id, meet_link }) => {
  await db.query(
    `INSERT INTO meetings (title, description, start_datetime, end_datetime, attendees, google_event_id, meet_link)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title          = VALUES(title),
       description    = VALUES(description),
       start_datetime = VALUES(start_datetime),
       end_datetime   = VALUES(end_datetime),
       attendees      = VALUES(attendees),
       meet_link      = VALUES(meet_link)`,
    [title, description, start_datetime, end_datetime, attendees, google_event_id, meet_link]
  );
};
