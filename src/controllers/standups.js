const db = require('../db');

exports.list = async (req, res) => {
  try {
    const { date, employee_id } = req.query;
    let query = `
      SELECT s.*, e.name AS employee_name, e.designation, e.profile_picture
      FROM standups s JOIN employees e ON s.employee_id = e.id
      WHERE 1=1`;
    const params = [];
    if (date) { query += ' AND s.standup_date = ?'; params.push(date); }
    if (employee_id) { query += ' AND s.employee_id = ?'; params.push(employee_id); }
    query += ' ORDER BY s.created_at DESC LIMIT 100';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.today = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.query(
      `SELECT s.*, e.name AS employee_name, e.designation, e.profile_picture
       FROM standups s JOIN employees e ON s.employee_id = e.id
       WHERE s.standup_date = ? ORDER BY s.created_at DESC`,
      [today]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { employee_id, yesterday, today, blockers, standup_date } = req.body;
  try {
    const date = standup_date || new Date().toISOString().split('T')[0];
    const [result] = await db.query(
      `INSERT INTO standups (employee_id, yesterday, today, blockers, standup_date)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE yesterday = VALUES(yesterday), today = VALUES(today), blockers = VALUES(blockers)`,
      [employee_id, yesterday, today, blockers, date]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
