const db = require('../db');

exports.upcoming = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ce.*, e.name AS employee_name, e.profile_picture
       FROM culture_events ce
       LEFT JOIN employees e ON ce.employee_id = e.id
       WHERE ce.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY ce.event_date ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ce.*, e.name AS employee_name
       FROM culture_events ce
       LEFT JOIN employees e ON ce.employee_id = e.id
       ORDER BY ce.event_date DESC LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { title, event_type, employee_id, event_date, description } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO culture_events (title, event_type, employee_id, event_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [title, event_type, employee_id || null, event_date, description]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
