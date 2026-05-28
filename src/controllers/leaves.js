const db = require('../db');

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

    const start = new Date(leave.start_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const end   = new Date(leave.end_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const days  = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / 86400000) + 1;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
    .card{background:#fff;border-radius:8px;padding:32px;max-width:560px;margin:auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    .header{border-bottom:3px solid #6366f1;padding-bottom:16px;margin-bottom:24px}
    .header h2{margin:0;color:#6366f1;font-size:20px}
    .header p{margin:4px 0 0;color:#666;font-size:13px}
    .row{display:flex;margin-bottom:10px}
    .label{width:140px;font-weight:600;color:#444;font-size:13px;flex-shrink:0}
    .value{color:#222;font-size:13px}
    .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;background:#f0f0ff;color:#6366f1;text-transform:capitalize}
    .pending{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;background:#fff7ed;color:#ea580c}
    .footer{margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>Leave Request Notification</h2>
      <p>Sent by ${leave.employee_name} via HR Management Platform</p>
    </div>
    <div class="row"><span class="label">Employee</span><span class="value">${leave.employee_name}</span></div>
    <div class="row"><span class="label">Designation</span><span class="value">${leave.designation}</span></div>
    <div class="row"><span class="label">Department</span><span class="value">${leave.department || '—'}</span></div>
    <div class="row"><span class="label">Leave Type</span><span class="value"><span class="badge">${leave.leave_type}</span></span></div>
    <div class="row"><span class="label">From</span><span class="value">${start}</span></div>
    <div class="row"><span class="label">To</span><span class="value">${end}</span></div>
    <div class="row"><span class="label">Duration</span><span class="value">${days} day${days !== 1 ? 's' : ''}</span></div>
    <div class="row"><span class="label">Reason</span><span class="value">${leave.reason || '—'}</span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="pending">${leave.status}</span></span></div>
    <div class="footer">Sent from HR Management Platform &bull; Please do not reply to this email</div>
  </div>
</body>
</html>`;

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
      subject: `Leave Request — ${leave.employee_name} | ${leave.leave_type} (${start} → ${end})`,
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

