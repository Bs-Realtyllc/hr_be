const db = require('../db');
const gc = require('../services/googleCalendar');

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, e.name AS creator_name
       FROM meetings m
       LEFT JOIN employees e ON m.created_by = e.id
       WHERE m.status = 'scheduled'
         AND m.start_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY m.start_datetime ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { title, description, start_datetime, end_datetime, attendees } = req.body;
  if (!title || !start_datetime || !end_datetime) {
    return res.status(400).json({ error: 'title, start_datetime, and end_datetime are required' });
  }

  let googleEventId = null;
  let meetLink = null;

  try {
    const result = await gc.createMeetingEvent({ title, description, startDateTime: start_datetime, endDateTime: end_datetime, attendees });
    googleEventId = result.googleEventId;
    meetLink      = result.meetLink;
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message;
    console.error('[meetings] Google Calendar error:', detail);
    return res.status(502).json({ error: `Google Calendar: ${detail}` });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO meetings (title, description, start_datetime, end_datetime, attendees, google_event_id, meet_link, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, start_datetime, end_datetime, JSON.stringify(attendees || []), googleEventId, meetLink, req.user.id]
    );
    res.status(201).json({ id: result.insertId, title, start_datetime, end_datetime, meetLink, googleEventId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [[meeting]] = await db.query('SELECT * FROM meetings WHERE id = ?', [id]);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    if (meeting.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query(`UPDATE meetings SET status = 'cancelled' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
