const path = require('path');
const fs   = require('fs');
const db   = require('../db');

exports.list = async (req, res) => {
  try {
    const { month, year } = req.query;
    const privileged = ['admin', 'lead'].includes(req.user?.role);

    let q = `SELECT r.*, e.name AS employee_name, e.designation, e.department
             FROM monthly_reports r
             JOIN employees e ON r.employee_id = e.id
             WHERE 1=1`;
    const p = [];

    if (!privileged) {
      // Employees see only their own submissions
      q += ' AND r.employee_id = ?';
      p.push(req.user.id);
    }

    if (month) { q += ' AND r.month = ?'; p.push(month); }
    if (year)  { q += ' AND r.year = ?';  p.push(year);  }

    q += ' ORDER BY r.year DESC, r.month DESC, r.submitted_at DESC';

    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submit = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { employee_id, title, month, year, notes } = req.body;
  if (!employee_id || !title || !month || !year) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'employee_id, title, month and year are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO monthly_reports (employee_id, title, month, year, file_name, file_path, file_size, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, title, month, year, req.file.originalname, req.file.path, req.file.size, notes || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
};

exports.download = async (req, res) => {
  try {
    const [[report]] = await db.query('SELECT * FROM monthly_reports WHERE id = ?', [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Not found' });

    // Employees can only download their own reports
    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && report.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.download(path.resolve(report.file_path), report.file_name);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [[report]] = await db.query('SELECT * FROM monthly_reports WHERE id = ?', [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Not found' });

    const privileged = ['admin', 'lead'].includes(req.user?.role);
    if (!privileged && report.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reports' });
    }

    fs.unlink(report.file_path, () => {});
    await db.query('DELETE FROM monthly_reports WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
