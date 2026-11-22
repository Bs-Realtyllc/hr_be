import * as leaveRepo from '../repositories/leave.repository';
import * as employeeRepo from '../repositories/employee.repository';
import * as payrollAdjustmentRepo from '../repositories/payrollAdjustment.repository';
import * as notificationPreferenceService from './notificationPreference.service';
import AppError from '../pkg/AppError';
import type { LeaveCreateInput, LeaveUpdateInput } from '../dtos/leave.dto';
import { toMonthlySalary, calculateLeaveDeduction } from '../pkg/payrollCalculator';
import { buildLeaveEmailSubject, buildLeaveEmailHtml } from './leaveEmailTemplate';
import { sendPlatformMail } from '../pkg/mailer';

async function notifyLeaveStatusIfNeeded(employeeId: number, status: 'approved' | 'rejected', leaveType: string, startDate: string, endDate: string) {
  if (!process.env.MAIL_HOST) return;
  try {
    const enabled = await notificationPreferenceService.isEnabled(employeeId, 'leave_request');
    if (enabled === false) return;
    const emp = await employeeRepo.findById(employeeId);
    if (!emp) return;
    const verb = status === 'approved' ? 'approved' : 'rejected';
    await sendPlatformMail(
      emp.email,
      `HR Platform — Leave Request ${verb === 'approved' ? 'Approved' : 'Rejected'}`,
      `<p>Hi ${emp.name},</p>
       <p>Your ${leaveType} leave request for <strong>${startDate}</strong> to <strong>${endDate}</strong> has been ${verb}.</p>
       <p style="color:#888;font-size:12px">HR Platform</p>`,
    );
  } catch (err: any) {
    console.error(`[leave] Failed to send leave ${status} email for employee ${employeeId}:`, err.message);
  }
}

// Notifies the requester's actual manager; falls back to all admins if they have
// none set, or if their manager isn't actually able to approve (not lead/admin).
async function notifyApproversOfNewLeaveRequest(employeeId: number, leaveType: string, startDate: string, endDate: string) {
  if (!process.env.MAIL_HOST) return;
  try {
    const requester = await employeeRepo.findById(employeeId);
    if (!requester) return;

    const manager = requester.manager_id ? await employeeRepo.findById(requester.manager_id) : null;
    const approvers = manager && ['admin', 'lead'].includes(manager.role)
      ? [manager]
      : await employeeRepo.findAdmins();

    for (const approver of approvers as any[]) {
      const enabled = await notificationPreferenceService.isEnabled(approver.id, 'leave_request_submitted');
      if (!enabled) continue;
      await sendPlatformMail(
        approver.email,
        'HR Platform — New Leave Request Needs Review',
        `<p>Hi ${approver.name},</p>
         <p>${requester.name} submitted a ${leaveType} leave request for <strong>${startDate}</strong> to <strong>${endDate}</strong>, pending your review.</p>
         <p style="color:#888;font-size:12px">HR Platform</p>`,
      );
    }
  } catch (err: any) {
    console.error(`[leave] Failed to notify approvers of new leave request from employee ${employeeId}:`, err.message);
  }
}

// Ids are assumed already validated by the caller (see create()).
async function sendLeaveNotifications(leaveId: number, notifyIds?: number[]) {
  if (!notifyIds?.length || !process.env.MAIL_HOST) return;

  try {
    const ids = [...new Set(notifyIds)];
    const rows = await employeeRepo.findEmailsByIds(ids);
    const emailById = new Map(rows.map((r) => [r.id, r.email]));

    const leave = await leaveRepo.findWithEmployeeById(leaveId);
    if (!leave) {
      console.error('[leave] Leave not found', leaveId);
      return;
    }

    const fmt: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const start = new Date((leave as any).start_date).toLocaleDateString('en-US', fmt);
    const end = new Date((leave as any).end_date).toLocaleDateString('en-US', fmt);
    const isSingleDay = (leave as any).start_date === (leave as any).end_date;

    const html = buildLeaveEmailHtml(leave, start, end, isSingleDay);
    const subject = buildLeaveEmailSubject(leaveId, leave.employee_name);

    for (const id of ids) {
      await sendPlatformMail(emailById.get(id)!, subject, html);
    }
    console.log('[leave] Notification sent for leave', leaveId, 'to', ids.length, 'recipient(s)');
  } catch (err: any) {
    console.error('[leave] Notification failed for leave', leaveId, ':', err.message);
  }
}

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, employeeIdFilter?: string, status?: string) {
  if (user.role === 'admin') {
    return leaveRepo.findWithNames({ employeeId: employeeIdFilter, status });
  }

  if (user.role === 'lead') {
    const reportIds = await employeeRepo.findDirectReportIds(user.id);
    const allowedIds = [user.id, ...reportIds];
    if (employeeIdFilter && !allowedIds.includes(Number(employeeIdFilter))) {
      throw new AppError('Cannot view leave requests outside your team', 403);
    }
    return leaveRepo.findWithNames({ employeeIds: employeeIdFilter ? [Number(employeeIdFilter)] : allowedIds, status });
  }

  return leaveRepo.findWithNames({ employeeId: user.id, status });
}

export async function balances(employeeId: string, actorId:string) {
  if(employeeId !== actorId) throw new AppError('Cannot view leave balance of other users', 403)
  const year = new Date().getFullYear();
  await ensureBalancesSeeded(employeeId, year);
  return leaveRepo.findBalances(employeeId, year);
}

// Lazily creates the year's default leave allotment the first time it's needed,
// so balances don't go missing once the calendar rolls over to a new year.
async function ensureBalancesSeeded(employeeId: number | string, year: number) {
  const existing = await leaveRepo.findBalances(employeeId, year);
  if (!existing.length) await employeeRepo.seedLeaveBalances(employeeId, year);
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
  actor: AuthUser,
  notify?: number[],
) {
  if (actor.role !== 'admin' && data.employee_id !== actor.id) {
    throw new AppError('You can only create leave requests for yourself', 403);
  }

  if (actor.role !== 'admin') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(data.start_date) < today) {
      throw new AppError('Cannot request leave for a date that has already passed', 400);
    }
  }

  // validate notify ids first so a bad id doesn't leave an orphan leave row
  if (notify?.length) {
    const rows = await employeeRepo.findEmailsByIds([...new Set(notify)]);
    const missing = notify.filter((id) => !rows.some((r) => r.id === id));
    if (missing.length) throw new AppError(`Unknown employee id(s): ${missing.join(', ')}`, 400);
  }

  const overlap = await leaveRepo.findOverlapping(data.employee_id, data.start_date, data.end_date);
  if (overlap) throw new AppError('You already have a leave request overlapping these dates', 400);

  const leaveId = await leaveRepo.create(data, actor.id);

  // fire-and-forget, as before: errors are logged inside the helper
  sendLeaveNotifications(leaveId, notify);

  notifyApproversOfNewLeaveRequest(
    data.employee_id,
    data.leave_type,
    data.start_date,
    data.end_date,
  );

  return leaveId;
}
export async function update(id: string, updates: LeaveUpdateInput, user: AuthUser) {
  const leave = await leaveRepo.findById(id);
  if (!leave) throw new AppError('Not found', 404);
  if (leave.employee_id !== user.id) throw new AppError('You can only edit your own leave requests', 403);
  if (leave.status !== 'pending') throw new AppError('Only pending leave requests can be edited', 400);

  if (updates.start_date || updates.end_date) {
    const startDate = updates.start_date ?? leave.start_date;
    const endDate = updates.end_date ?? leave.end_date;

    if (user.role !== 'admin') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(startDate) < today) {
        throw new AppError('Cannot request leave for a date that has already passed', 400);
      }
    }

    const overlap = await leaveRepo.findOverlapping(leave.employee_id, startDate, endDate, id);
    if (overlap) throw new AppError('You already have a leave request overlapping these dates', 400);
  }

  await leaveRepo.update(id, updates, user.id);
}

export async function cancel(id: string, user: AuthUser) {
  const leave = await leaveRepo.findById(id);
  if (!leave) throw new AppError('Not found', 404);
  if (leave.employee_id !== user.id) throw new AppError('You can only cancel your own leave requests', 403);
  if (leave.status !== 'pending') throw new AppError('Only pending leave requests can be cancelled', 400);
  await leaveRepo.remove(id);
}

export async function approve(id: string, user: AuthUser) {
  const leave = await leaveRepo.findById(id);
  if (!leave) throw new AppError('Not found', 404);

  if(leave.status === 'approved' || leave.status === 'rejected'){
    throw new AppError(`Leave request has already been ${leave.status}`, 400)
  }

  if (leave.employee_id === user.id) {
    throw new AppError('You cannot approve your own leave request', 403);
  }

  await assertCanReview(leave, user);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(leave.end_date) < today) {
    throw new AppError('Cannot approve a leave request whose dates have already passed.', 400);
  }

  const start = new Date(leave.start_date);
  const end = new Date(leave.end_date);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const year = start.getFullYear();

  await ensureBalancesSeeded(leave.employee_id, year);
  await applyLeaveDeductionIfNeeded(leave, days, year);
  await leaveRepo.approve(id, user.id);
  await leaveRepo.incrementBalanceTaken(leave.employee_id, leave.leave_type, year, days);
  notifyLeaveStatusIfNeeded(leave.employee_id, 'approved', leave.leave_type, leave.start_date, leave.end_date);
}

export async function reject(id: string, user: AuthUser) {
  const leave = await leaveRepo.findById(id);
  if (!leave) throw new AppError('Not found', 404);

  if(leave.status === 'approved' || leave.status === 'rejected'){
    throw new AppError(`Leave request has already been ${leave.status}`, 400)
  }

  if (leave.employee_id === user.id) {
    throw new AppError('You cannot reject your own leave request', 403);
  }

  await assertCanReview(leave, user);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(leave.end_date) < today) {
    throw new AppError('Cannot reject a leave request whose dates have already passed.', 400);
  }

  await leaveRepo.reject(id, user.id);
  notifyLeaveStatusIfNeeded(leave.employee_id, 'rejected', leave.leave_type, leave.start_date, leave.end_date);
}

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

// Admins can review anyone; leads can only review their own direct reports.
async function assertCanReview(leave: any, user: AuthUser) {
  if (user.role === 'admin') return;

  const requester = await employeeRepo.findById(leave.employee_id);
  if (!requester || requester.manager_id !== user.id) {
    throw new AppError('You can only approve or reject leave requests for your direct reports', 403);
  }
}

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

