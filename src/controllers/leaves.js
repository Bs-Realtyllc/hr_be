const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const leaveDto = require('../dtos/leaveDto');
const { buildLeaveEmailSubject, buildLeaveEmailHtml } = require('./leaveEmailTemplate');
const { toMonthlySalary, calculateLeaveDeduction } = require('../pkg/payrollCalculator');

// If the approved leave eats into more days than the employee has left in their balance,
// the excess is deducted from salary at the employee's daily rate (salary / 26 working days).
async function applyLeaveDeductionIfNeeded(leave, days, year) {
  const balance = await LeaveRequest.findBalanceForType(leave.employee_id, leave.leave_type, year);
  const remaining = balance ? balance.remaining : 0;
  const excessDays = days - remaining;
  if (excessDays <= 0) return;

  const emp = await Employee.findPayrollBaseById(leave.employee_id);
  if (!emp?.salary) return;

  const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
  const { dailyRate, amount } = calculateLeaveDeduction(monthlySalary, excessDays);
  if (amount <= 0) return;

  await PayrollAdjustment.create({
    employee_id: leave.employee_id,
    type: 'leave_deduction',
    title: `Leave Deduction — ${excessDays} day(s) beyond ${leave.leave_type} balance`,
    amount: -amount,
    year,
    month: new Date(leave.start_date).getMonth() + 1,
    reference_type: 'leave_request',
    reference_id: leave.id,
    notes: `Daily rate Rs. ${dailyRate} × ${excessDays} day(s) over balance`,
  });
}

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

function daysTakenByEmployee(ranges, rangeStart, rangeEnd) {
  const map = {};
  for (const r of ranges) {
    const s = new Date(Math.max(new Date(r.start_date), rangeStart));
    const e = new Date(Math.min(new Date(r.end_date), rangeEnd));
    const days = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
    map[r.employee_id] = (map[r.employee_id] || 0) + Math.max(days, 0);
  }
  return map;
}

exports.report = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const thisMonthStart = new Date(year, month, 1);
    const thisMonthEnd   = new Date(year, month + 1, 0);
    const prevMonthStart = new Date(year, month - 1, 1);
    const prevMonthEnd   = new Date(year, month, 0);

    const fmt = (d) => d.toISOString().split('T')[0];

    const [balances, thisMonthRanges, prevMonthRanges] = await Promise.all([
      LeaveRequest.findBalanceTotalsForYear(year),
      LeaveRequest.findApprovedRangesForAllInRange(fmt(thisMonthStart), fmt(thisMonthEnd)),
      LeaveRequest.findApprovedRangesForAllInRange(fmt(prevMonthStart), fmt(prevMonthEnd)),
    ]);

    const thisMonthMap = daysTakenByEmployee(thisMonthRanges, thisMonthStart, thisMonthEnd);
    const prevMonthMap = daysTakenByEmployee(prevMonthRanges, prevMonthStart, prevMonthEnd);

    const report = balances.map((b) => ({
      employee_id:          b.employee_id,
      employee_name:        b.employee_name,
      total_leaves:         Number(b.total_leaves),
      taken_previous_month: prevMonthMap[b.employee_id] || 0,
      taken_this_month:     thisMonthMap[b.employee_id] || 0,
      remaining_leaves:     Number(b.total_leaves) - Number(b.total_taken),
    }));

    res.json(report);
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

    await applyLeaveDeductionIfNeeded(leave, days, year);
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
