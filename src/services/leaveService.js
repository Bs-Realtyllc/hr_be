const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const { buildLeaveEmailSubject, buildLeaveEmailHtml } = require('../controllers/leaveEmailTemplate');
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
exports.applyLeaveDeductionIfNeeded = applyLeaveDeductionIfNeeded;

async function sendEmailAsync(leave_id, employee_id, to, cc, bcc) {
  const nodemailer = require('nodemailer');
  const { getForSending } = require('../controllers/emailSettings');
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
exports.sendEmailAsync = sendEmailAsync;

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
exports.daysTakenByEmployee = daysTakenByEmployee;

// Builds the admin leave report: per-employee balance + days taken this/previous month.
exports.buildLeaveReport = async () => {
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

  return balances.map((b) => ({
    employee_id:          b.employee_id,
    employee_name:        b.employee_name,
    total_leaves:         Number(b.total_leaves),
    taken_previous_month: prevMonthMap[b.employee_id] || 0,
    taken_this_month:     thisMonthMap[b.employee_id] || 0,
    remaining_leaves:     Number(b.total_leaves) - Number(b.total_taken),
  }));
};

// Approves a leave request: validates role/ownership/date rules, applies any leave
// deduction, marks it approved, and increments the balance taken. Throws an Error
// with `.status` set for the controller to translate into an HTTP response.
exports.approve = async (id, user) => {
  const role = user?.role;
  if (role === 'employee') {
    const err = new Error('Insufficient permissions');
    err.status = 403;
    throw err;
  }

  const leave = await LeaveRequest.findById(id);
  if (!leave) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  if (role === 'lead' && leave.employee_id === user.id) {
    const err = new Error('Team leads cannot approve their own leave requests');
    err.status = 403;
    throw err;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (new Date(leave.end_date) < today) {
    const err = new Error('Cannot approve a leave request whose dates have already passed.');
    err.status = 400;
    throw err;
  }

  const start = new Date(leave.start_date);
  const end = new Date(leave.end_date);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const year = start.getFullYear();

  await applyLeaveDeductionIfNeeded(leave, days, year);
  await LeaveRequest.approve(id, user.id);
  await LeaveRequest.incrementBalanceTaken(leave.employee_id, leave.leave_type, year, days);
};

// Rejects a leave request: validates role/ownership/date rules, marks it rejected.
exports.reject = async (id, user) => {
  const role = user?.role;
  if (role === 'employee') {
    const err = new Error('Insufficient permissions');
    err.status = 403;
    throw err;
  }

  const leave = await LeaveRequest.findById(id);
  if (!leave) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  if (role === 'lead' && leave.employee_id === user.id) {
    const err = new Error('Team leads cannot reject their own leave requests');
    err.status = 403;
    throw err;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (new Date(leave.end_date) < today) {
    const err = new Error('Cannot reject a leave request whose dates have already passed.');
    err.status = 400;
    throw err;
  }

  await LeaveRequest.reject(id, user.id);
};
