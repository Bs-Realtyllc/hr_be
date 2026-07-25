const LeaveRequest = require('../models/LeaveRequest');
const leaveDto = require('../dtos/leaveDto');
const { buildLeaveEmailSubject, buildLeaveEmailHtml } = require('./leaveEmailTemplate');

async function sendEmailAsync(leave_id, employee_id, to, cc, bcc) {
  const nodemailer = require('nodemailer');
  const { getForSending } = require('./emailSettings');
  try {
    const cfg = await getForSending(employee_id);
    if (!cfg) { console.error('[email] No config for employee', employee_id); return; }

    const leave = await LeaveRequest.findWithEmployeeById(leave_id);
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

    const filterEmployeeId = privileged ? employee_id : req.user.id;
    const rows = await LeaveRequest.findWithNames({ employeeId: filterEmployeeId, status });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.balances = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const rows = await LeaveRequest.findBalances(req.params.employeeId, year);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.outToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const rows = await LeaveRequest.findOutToday(today);
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
    const rows = await LeaveRequest.findOutInRange(monday.toISOString().split('T')[0], friday.toISOString().split('T')[0]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { to, cc, bcc } = req.body;
  try {
    const data = leaveDto.toCreateInput(req.body);
    const leave_id = await LeaveRequest.create(data);
    res.status(201).json({ id: leave_id });
    if (to) sendEmailAsync(leave_id, data.employee_id, to, cc, bcc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approve = async (req, res) => {
  const role = req.user?.role;
  if (role === 'employee') return res.status(403).json({ error: 'Insufficient permissions' });

  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Not found' });

    if (role === 'lead' && leave.employee_id === req.user.id) {
      return res.status(403).json({ error: 'Team leads cannot approve their own leave requests' });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(leave.end_date) < today) {
      return res.status(400).json({ error: 'Cannot approve a leave request whose dates have already passed.' });
    }

    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const year = start.getFullYear();

    await LeaveRequest.approve(req.params.id, req.user.id);
    await LeaveRequest.incrementBalanceTaken(leave.employee_id, leave.leave_type, year, days);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reject = async (req, res) => {
  const role = req.user?.role;
  if (role === 'employee') return res.status(403).json({ error: 'Insufficient permissions' });

  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Not found' });

    if (role === 'lead' && leave.employee_id === req.user.id) {
      return res.status(403).json({ error: 'Team leads cannot reject their own leave requests' });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(leave.end_date) < today) {
      return res.status(400).json({ error: 'Cannot reject a leave request whose dates have already passed.' });
    }

    await LeaveRequest.reject(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Not found' });

    if (leave.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own leave requests' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be edited' });
    }

    await LeaveRequest.update(req.params.id, leaveDto.toUpdateInput(req.body));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Not found' });

    if (leave.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own leave requests' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be cancelled' });
    }

    await LeaveRequest.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
