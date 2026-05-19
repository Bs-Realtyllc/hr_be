const db = require('../db');

exports.list = async (req, res) => {
  try {
    const { employee_id, status } = req.query;
    let query = `
      SELECT lr.*, e.name AS employee_name, e.designation,
             r.name AS reviewer_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN employees r ON lr.reviewed_by = r.id
      WHERE 1=1`;
    const params = [];
    if (employee_id) { query += ' AND lr.employee_id = ?'; params.push(employee_id); }
    if (status) { query += ' AND lr.status = ?'; params.push(status); }
    query += ' ORDER BY lr.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.balances = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const [rows] = await db.query(
      `SELECT *, (total - taken) AS remaining
       FROM leave_balances
       WHERE employee_id = ? AND year = ?`,
      [req.params.employeeId, year]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.outToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.query(
      `SELECT e.name, e.designation, e.profile_picture, lr.leave_type, lr.end_date
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.status = 'approved' AND ? BETWEEN lr.start_date AND lr.end_date`,
      [today]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.outThisWeek = async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 6);
    const [rows] = await db.query(
      `SELECT e.name, e.designation, lr.leave_type, lr.start_date, lr.end_date
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.status = 'approved'
         AND lr.start_date <= ? AND lr.end_date >= ?`,
      [friday.toISOString().split('T')[0], monday.toISOString().split('T')[0]]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { employee_id, leave_type, start_date, end_date, reason } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [employee_id, leave_type, start_date, end_date, reason]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approve = async (req, res) => {
  const { reviewed_by } = req.body;
  try {
    const [req_rows] = await db.query(`SELECT * FROM leave_requests WHERE id = ?`, [req.params.id]);
    if (!req_rows.length) return res.status(404).json({ error: 'Not found' });
    const leave = req_rows[0];

    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const year = start.getFullYear();

    await db.query(
      `UPDATE leave_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [reviewed_by || null, req.params.id]
    );
    await db.query(
      `UPDATE leave_balances SET taken = taken + ?
       WHERE employee_id = ? AND leave_type = ? AND year = ?`,
      [days, leave.employee_id, leave.leave_type, year]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reject = async (req, res) => {
  const { reviewed_by } = req.body;
  try {
    await db.query(
      `UPDATE leave_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [reviewed_by || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
