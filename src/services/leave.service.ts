import * as leaveRepo from '../repositories/leave.repository';
import * as employeeRepo from '../repositories/employee.repository';
import * as payrollAdjustmentRepo from '../repositories/payrollAdjustment.repository';
import * as emailSettingsRepo from '../repositories/emailSettings.repository';
import AppError from '../pkg/AppError';
import type { LeaveCreateInput, LeaveUpdateInput } from '../dtos/leave.dto';
import { toMonthlySalary, calculateLeaveDeduction } from '../pkg/payrollCalculator';
// Not yet converted — untouched .js helper (pure HTML template builder, no DB/architecture concerns).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildLeaveEmailSubject, buildLeaveEmailHtml } = require('../controllers/leaveEmailTemplate');

interface AuthUser {
  id: number;
  role: string;
}

// Business logic only — no req/res, no raw request bodies. Every input here
// is already bound+validated by leave.controller.ts via leave.dto.ts.

export async function list(user: AuthUser, employeeIdFilter?: string, status?: string) {
  const privileged = ['admin', 'lead'].includes(user.role);
  const filterEmployeeId = privileged ? employeeIdFilter : user.id;
  return leaveRepo.findWithNames({ employeeId: filterEmployeeId, status });
}

export async function balances(employeeId: string) {
  const year = new Date().getFullYear();
  return leaveRepo.findBalances(employeeId, year);
}

export async function outToday() {
  const today = new Date().toISOString().split('T')[0];
  return leaveRepo.findOutToday(today);
}

export async function outThisWeek() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 6);
  return leaveRepo.findOutInRange(monday.toISOString().split('T')[0], friday.toISOString().split('T')[0]);
}

export async function create(
  data: LeaveCreateInput,
  actorId: number | null,
  emailParams: { to?: string; cc?: string; bcc?: string } = {}
) {
  const leaveId = await leaveRepo.create(data, actorId);
  if (emailParams.to) {
    // Fire-and-forget, same as the original — the HTTP response doesn't wait on this.
    sendEmailAsync(leaveId, data.employee_id, emailParams.to, emailParams.cc, emailParams.bcc);
  }
  return leaveId;
}

export async function update(id: string, updates: LeaveUpdateInput, userId: number) {
  const leave = await leaveRepo.findById(id);
  if (!leave) throw new AppError('Not found', 404);
  if (leave.employee_id !== userId) throw new AppError('You can only edit your own leave requests', 403);
  if (leave.status !== 'pending') throw new AppError('Only pending leave requests can be edited', 400);
  await leaveRepo.update(id, updates, userId);
}

export async function cancel(id: string, userId: number) {
  const leave = await leaveRepo.findById(id);
  if (!leave) throw new AppError('Not found', 404);
  if (leave.employee_id !== userId) throw new AppError('You can only cancel your own leave requests', 403);
  if (leave.status !== 'pending') throw new AppError('Only pending leave requests can be cancelled', 400);
  await leaveRepo.remove(id);
}

// Approves a leave request: validates role/ownership/date rules, applies any leave
// deduction, marks it approved, and increments the balance taken.
export async function approve(id: string, user: AuthUser) {
  if (user.role === 'employee') throw new AppError('Insufficient permissions', 403);

  const leave = await leaveRepo.findById(id);
  if (!leave) throw new AppError('Not found', 404);

  if (user.role === 'lead' && leave.employee_id === user.id) {
    throw new AppError('Team leads cannot approve their own leave requests', 403);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(leave.end_date) < today) {
    throw new AppError('Cannot approve a leave request whose dates have already passed.', 400);
  }

  const start = new Date(leave.start_date);
  const end = new Date(leave.end_date);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const year = start.getFullYear();

  await applyLeaveDeductionIfNeeded(leave, days, year);
  await leaveRepo.approve(id, user.id);
  await leaveRepo.incrementBalanceTaken(leave.employee_id, leave.leave_type, year, days);
}

// Rejects a leave request: validates role/ownership/date rules, marks it rejected.
export async function reject(id: string, user: AuthUser) {
  if (user.role === 'employee') throw new AppError('Insufficient permissions', 403);

  const leave = await leaveRepo.findById(id);
  if (!leave) throw new AppError('Not found', 404);

  if (user.role === 'lead' && leave.employee_id === user.id) {
    throw new AppError('Team leads cannot reject their own leave requests', 403);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(leave.end_date) < today) {
    throw new AppError('Cannot reject a leave request whose dates have already passed.', 400);
  }

  await leaveRepo.reject(id, user.id);
}

// Builds the admin leave report: per-employee balance + days taken this/previous month.
export async function report() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const thisMonthStart = new Date(year, month, 1);
  const thisMonthEnd = new Date(year, month + 1, 0);
  const prevMonthStart = new Date(year, month - 1, 1);
  const prevMonthEnd = new Date(year, month, 0);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const [balancesRows, thisMonthRanges, prevMonthRanges] = await Promise.all([
    leaveRepo.findBalanceTotalsForYear(year),
    leaveRepo.findApprovedRangesForAllInRange(fmt(thisMonthStart), fmt(thisMonthEnd)),
    leaveRepo.findApprovedRangesForAllInRange(fmt(prevMonthStart), fmt(prevMonthEnd)),
  ]);

  const thisMonthMap = daysTakenByEmployee(thisMonthRanges as any[], thisMonthStart, thisMonthEnd);
  const prevMonthMap = daysTakenByEmployee(prevMonthRanges as any[], prevMonthStart, prevMonthEnd);

  return balancesRows.map((b: any) => ({
    employee_id: b.employee_id,
    employee_name: b.employee_name,
    total_leaves: Number(b.total_leaves),
    taken_previous_month: prevMonthMap[b.employee_id] || 0,
    taken_this_month: thisMonthMap[b.employee_id] || 0,
    remaining_leaves: Number(b.total_leaves) - Number(b.total_taken),
  }));
}

// ── internal helpers ────────────────────────────────────────────────────────

// If the approved leave eats into more days than the employee has left in their balance,
// the excess is deducted from salary at the employee's daily rate (salary / 26 working days).
async function applyLeaveDeductionIfNeeded(leave: any, days: number, year: number) {
  const balance = await leaveRepo.findBalanceForType(leave.employee_id, leave.leave_type, year);
  const remaining = balance ? (balance as any).remaining : 0;
  const excessDays = days - remaining;
  if (excessDays <= 0) return;

  const emp = await employeeRepo.findPayrollBaseById(leave.employee_id);
  if (!emp?.salary) return;

  const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
  const { dailyRate, amount } = calculateLeaveDeduction(monthlySalary, excessDays);
  if (amount <= 0) return;

  await payrollAdjustmentRepo.create({
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

async function sendEmailAsync(leaveId: number, employeeId: number, to: string, cc?: string, bcc?: string) {
  const nodemailer = require('nodemailer');
  try {
    const cfg = await emailSettingsRepo.findFullByEmployeeId(employeeId);
    if (!cfg) {
      console.error('[email] No config for employee', employeeId);
      return;
    }

    const leave = await leaveRepo.findWithEmployeeById(leaveId);
    if (!leave) {
      console.error('[email] Leave not found', leaveId);
      return;
    }

    const fmt: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const start = new Date((leave as any).start_date).toLocaleDateString('en-US', fmt);
    const end = new Date((leave as any).end_date).toLocaleDateString('en-US', fmt);
    const isSingleDay = (leave as any).start_date === (leave as any).end_date;

    const html = buildLeaveEmailHtml(leave, start, end, isSingleDay);

    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port: cfg.smtp_port,
      secure: cfg.smtp_port === 465,
      auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
    });
    await transporter.sendMail({
      from: `"${(leave as any).employee_name}" <${cfg.smtp_from || cfg.smtp_user}>`,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: buildLeaveEmailSubject(),
      html,
    });
    console.log('[email] Leave notification sent for leave', leaveId);
  } catch (err: any) {
    console.error('[email] Send failed for leave', leaveId, ':', err.message);
  }
}

function daysTakenByEmployee(ranges: any[], rangeStart: Date, rangeEnd: Date) {
  const map: Record<number, number> = {};
  for (const r of ranges) {
    const s = new Date(Math.max(new Date(r.start_date).getTime(), rangeStart.getTime()));
    const e = new Date(Math.min(new Date(r.end_date).getTime(), rangeEnd.getTime()));
    const days = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    map[r.employee_id] = (map[r.employee_id] || 0) + Math.max(days, 0);
  }
  return map;
}
