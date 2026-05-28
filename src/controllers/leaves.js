const db = require('../db');
const { buildLeaveEmailSubject, buildLeaveEmailHtml } = require('./leaveEmailTemplate');

async function sendEmailAsync(leave_id, employee_id, to, cc, bcc) {
  const nodemailer = require('nodemailer');
  const { getForSending } = require('./emailSettings');
  try {
    const cfg = await getForSending(employee_id);
    if (!cfg) { console.error('[email] No config for employee', employee_id); return; }

    const [[leave]] = await db.query(
      `SELECT lr.*, e.name AS employee_name, e.designation, e.department
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.id = ?`,
      [leave_id]
    );
    if (!leave) { console.error('[email] Leave not found', leave_id); return; }

    const fmt = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const start = new Date(leave.start_date).toLocaleDateString('en-US', fmt);
    const end   = new Date(leave.end_date).toLocaleDateString('en-US', fmt);
    const isSingleDay = leave.start_date === leave.end_date;

    const html = buildLeaveEmailHtml(leave, start, end, isSingleDay);

    const transporter = nodemailer.createTransport({
      host:   cfg.smtp_host,
      port:   cfg.smtp_port,
      secure: cfg.smtp_port === 465,
      auth:   { user: cfg.smtp_user, pass: cfg.smtp_pass },
    });
    await transporter.sendMail({
      from:    `"${leave.employee_name}" <${cfg.smtp_from || cfg.smtp_user}>`,
      to,
      cc:      cc  || undefined,
      bcc:     bcc || undefined,
      subject: buildLeaveEmailSubject(),
      html,
    });
    console.log('[email] Leave notification sent for leave', leave_id);
  } catch (err) {
    console.error('[email] Send failed for leave', leave_id, ':', err.message);
  }
}

exports.list = async (req, res) => {
  try {
    const { employee_id, status } = req.query;
    const privileged = ['admin', 'lead'].includes(req.user?.role);

    let query = `
      SELECT lr.*, e.name AS employee_name, e.designation,
             r.name AS reviewer_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN employees r ON lr.reviewed_by = r.id
      WHERE 1=1`;
    const params = [];

    if (!privileged) {
      query += ' AND lr.employee_id = ?';
      params.push(req.user.id);
    } else if (employee_id) {
      query += ' AND lr.employee_id = ?';
      params.push(employee_id);
    }

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
  const { employee_id, leave_type, start_date, end_date, reason, to, cc, bcc } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [employee_id, leave_type, start_date, end_date, reason]
    );
    const leave_id = result.insertId;
    res.status(201).json({ id: leave_id });
    if (to) sendEmailAsync(leave_id, employee_id, to, cc, bcc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approve = async (req, res) => {
  const role = req.user?.role;
  if (role === 'employee') return res.status(403).json({ error: 'Insufficient permissions' });

  try {
    const [req_rows] = await db.query(`SELECT * FROM leave_requests WHERE id = ?`, [req.params.id]);
    if (!req_rows.length) return res.status(404).json({ error: 'Not found' });
    const leave = req_rows[0];

    if (role === 'lead' && leave.employee_id === req.user.id) {
      return res.status(403).json({ error: 'Team leads cannot approve their own leave requests' });
    }

    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const year = start.getFullYear();

    await db.query(
      `UPDATE leave_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [req.user.id, req.params.id]
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
  const role = req.user?.role;
  if (role === 'employee') return res.status(403).json({ error: 'Insufficient permissions' });

  try {
    const [req_rows] = await db.query(`SELECT * FROM leave_requests WHERE id = ?`, [req.params.id]);
    if (!req_rows.length) return res.status(404).json({ error: 'Not found' });
    const leave = req_rows[0];

    if (role === 'lead' && leave.employee_id === req.user.id) {
      return res.status(403).json({ error: 'Team leads cannot reject their own leave requests' });
    }

    await db.query(
      `UPDATE leave_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const leave = rows[0];

    if (leave.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own leave requests' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be edited' });
    }

    const { leave_type, start_date, end_date, reason } = req.body;
    await db.query(
      'UPDATE leave_requests SET leave_type = ?, start_date = ?, end_date = ?, reason = ? WHERE id = ?',
      [leave_type, start_date, end_date, reason, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const leave = rows[0];

    if (leave.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own leave requests' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be cancelled' });
    }

    await db.query('DELETE FROM leave_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

