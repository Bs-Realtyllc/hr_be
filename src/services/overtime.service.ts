import * as overtimeRepo from '../repositories/overtime.repository';
import * as employeeRepo from '../repositories/employee.repository';
import * as payrollAdjustmentRepo from '../repositories/payrollAdjustment.repository';
import * as companySettingsRepo from '../repositories/companySettings.repository';
import * as notificationPreferenceService from './notificationPreference.service';
import * as clockService from './clock.service';
import AppError from '../pkg/AppError';
import type { OvertimeCreateInput } from '../dtos/overtime.dto';
import * as overtimeDto from '../dtos/overtime.dto';
import { toMonthlySalary, calculateOvertimePay } from '../pkg/payrollCalculator';
import { sendPlatformMail } from '../pkg/mailer';
import { nepalDateString } from '../pkg/timezone';

const OVERTIME_MISMATCH_TOLERANCE_SECONDS = 15 * 60;

function timeStringToSeconds(hhmmss: string): number {
  const [h, m, s] = hhmmss.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

// null means "no company working hours configured" — there's no "normal
// shift" to compare clocked time against, so verification can't run at all.
async function getExpectedShiftSeconds(): Promise<number | null> {
  const settings = await companySettingsRepo.find();
  if (!settings?.work_start || !settings?.work_end) return null;
  return timeStringToSeconds(settings.work_end) - timeStringToSeconds(settings.work_start);
}

function computeMismatch(expectedShiftSeconds: number, clockedSeconds: number, hours: number | string): boolean {
  const impliedOvertimeSeconds = Math.max(0, clockedSeconds - expectedShiftSeconds);
  const claimedSeconds = Math.round(Number(hours) * 3600);
  return Math.abs(impliedOvertimeSeconds - claimedSeconds) > OVERTIME_MISMATCH_TOLERANCE_SECONDS;
}

// Cross-checks a *planned* request's work_date (once it's passed) against
// what the employee actually clocked — a preview of what reconcile() will
// find. 'worked' requests are skipped entirely: they're always built
// directly from the exact clock sessions they claim now, so there's
// nothing left to verify — comparing against the whole day's clocked time
// would compare the wrong thing and produce false "mismatches".
async function verifyAgainstClockData<
  T extends { employee_id: number; work_date: string; hours: string | number; request_type: 'planned' | 'worked' },
>(rows: T[]): Promise<(T & { clocked_seconds: number | null; hours_mismatch: boolean | null; clocked_seconds_estimated: boolean })[]> {
  const expectedShiftSeconds = await getExpectedShiftSeconds();
  if (expectedShiftSeconds == null) {
    return rows.map((r) => ({ ...r, clocked_seconds: null, hours_mismatch: null, clocked_seconds_estimated: false }));
  }

  const today = nepalDateString();
  return Promise.all(
    rows.map(async (r) => {
      if (r.request_type === 'worked' || r.work_date > today) {
        return { ...r, clocked_seconds: null, hours_mismatch: null, clocked_seconds_estimated: false };
      }
      const { seconds: clockedSeconds, estimated: clocked_seconds_estimated } =
        await clockService.getTotalClockedSecondsForDate(r.employee_id, r.work_date);
      const hours_mismatch = computeMismatch(expectedShiftSeconds, clockedSeconds, r.hours);
      return { ...r, clocked_seconds: clockedSeconds, hours_mismatch, clocked_seconds_estimated };
    }),
  );
}

async function notifyOvertimeStatusIfNeeded(employeeId: number, status: 'approved' | 'rejected', workDate: string, hours: number) {
  if (!process.env.MAIL_HOST) return;
  try {
    const enabled = await notificationPreferenceService.isEnabled(employeeId, 'overtime_request');
    if (!enabled) return;
    const emp = await employeeRepo.findById(employeeId);
    if (!emp) return;
    await sendPlatformMail(
      emp.email,
      `HR Platform — Overtime Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `<p>Hi ${emp.name},</p>
       <p>Your overtime request for <strong>${hours}h</strong> on <strong>${workDate}</strong> has been ${status}.</p>
       <p style="color:#888;font-size:12px">HR Platform</p>`,
    );
  } catch (err: any) {
    console.error(`[overtime] Failed to send overtime ${status} email for employee ${employeeId}:`, err.message);
  }
}

// Every employee with role 'lead' gets notified, regardless of manager_id —
// there's no reporting-chain targeting here, just a role check.
async function notifyApproversOfNewOvertimeRequest(employeeId: number, workDate: string, hours: number) {
  if (!process.env.MAIL_HOST) return;
  try {
    const [requester, leads] = await Promise.all([
      employeeRepo.findById(employeeId),
      employeeRepo.findLeads(),
    ]);
    if (!requester) return;

    for (const lead of leads) {
      const enabled = await notificationPreferenceService.isEnabled(lead.id, 'overtime_request_submitted');
      if (!enabled) continue;
      await sendPlatformMail(
        lead.email,
        'HR Platform — New Overtime Request Needs Review',
        `<p>Hi ${lead.name},</p>
         <p>${requester.name} submitted an overtime request for <strong>${hours}h</strong> on <strong>${workDate}</strong>, pending your review.</p>
         <p style="color:#888;font-size:12px">HR Platform</p>`,
      );
    }
  } catch (err: any) {
    console.error(`[overtime] Failed to notify approvers of new overtime request from employee ${employeeId}:`, err.message);
  }
}

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, employeeIdFilter?: string, status?: string) {
  const privileged = ['admin', 'lead'].includes(user.role);
  const filterEmployeeId = privileged ? employeeIdFilter : user.id;
  const rows = await overtimeRepo.findWithNames({ employeeId: filterEmployeeId, status });
  const verified = await verifyAgainstClockData(rows as any);

  const sessionsByRequest = await overtimeRepo.findSessionsForRequests(verified.map((r: any) => r.id));
  const today = nepalDateString();
  return verified.map((r: any) => {
    const sessions = sessionsByRequest.get(r.id) ?? [];
    return {
      ...r,
      session_count: sessions.length,
      sessions,
      needs_reconciliation:
        r.request_type === 'planned' && r.status === 'approved' && !r.reconciled_at && r.work_date <= today,
    };
  });
}

export async function create(data: OvertimeCreateInput, userRole: string) {
  // Admin doesn't clock in (no Tracker access), so there's never attendance
  // data to verify a personal claim against — admin reviews requests
  // instead of submitting their own.
  if (userRole === 'admin') {
    throw new AppError('Admin accounts review overtime requests and cannot submit their own', 403);
  }

  if (data.request_type === 'planned') {
    if (!data.work_date || !data.hours) {
      throw new AppError('Work date and estimated hours are required', 400);
    }
    const id = await overtimeRepo.create(data);
    notifyApproversOfNewOvertimeRequest(data.employee_id, data.work_date, data.hours);
    return id;
  }

  // 'worked' — always built from one or more real clock sessions now;
  // there's no manual fallback, so work_date/hours are always derived,
  // never trusted from the client.
  const clockIds = data.clock_ids ?? [];
  if (clockIds.length === 0) {
    throw new AppError('Select at least one clock session to claim', 400);
  }

  const alreadyClaimed = await overtimeRepo.findActiveClockIds(clockIds);
  if (alreadyClaimed.length > 0) {
    throw new AppError('One or more of those clock sessions have already been claimed on another overtime request', 409);
  }

  const shifts = await Promise.all(clockIds.map((id) => clockService.getShiftSummary(id)));
  let totalSeconds = 0;
  let sharedDate: string | null = null;
  for (let i = 0; i < shifts.length; i++) {
    const shift = shifts[i];
    if (!shift) throw new AppError('Clock session not found', 404);
    if (shift.employeeId !== data.employee_id) throw new AppError('That clock session does not belong to you', 403);
    if (!shift.clockOut) throw new AppError("Can't claim overtime for a session that's still running — clock out first", 400);
    if (sharedDate == null) sharedDate = shift.clockDate;
    else if (shift.clockDate !== sharedDate) {
      // Defensive — the frontend groups selections by date before calling
      // create() once per date, but the server never trusts that happened.
      throw new AppError('All selected sessions must be from the same day — submit one request per day', 400);
    }
    totalSeconds += shift.totalSeconds;
  }

  const hours = Math.round((totalSeconds / 3600) * 2) / 2; // nearest half-hour, matching the form's step
  if (hours <= 0) {
    throw new AppError('The selected session(s) have no recorded time to claim', 400);
  }

  const id = await overtimeRepo.create({ ...data, work_date: sharedDate, hours }, clockIds);
  notifyApproversOfNewOvertimeRequest(data.employee_id, sharedDate as string, hours);
  return id;
}

export async function update(id: string, rawBody: unknown, userId: number) {
  const ot = await overtimeRepo.findById(id);
  if (!ot) throw new AppError('Not found', 404);
  if (ot.employee_id !== userId) throw new AppError('You can only edit your own overtime requests', 403);
  if (ot.status !== 'pending') throw new AppError('Only pending overtime requests can be edited', 400);
  if (ot.request_type !== 'planned') {
    // 'worked' requests are always derived from clock sessions now — there's
    // nothing free-typed left to edit; cancel and resubmit instead.
    throw new AppError('Logged overtime is derived from your clock sessions and cannot be edited — cancel and resubmit instead', 400);
  }

  const updates = overtimeDto.toUpdateInput(rawBody);
  await overtimeRepo.update(id, updates, userId);
}

export async function cancel(id: string, userId: number) {
  const ot = await overtimeRepo.findById(id);
  if (!ot) throw new AppError('Not found', 404);
  if (ot.employee_id !== userId) throw new AppError('You can only cancel your own overtime requests', 403);
  if (ot.status !== 'pending') throw new AppError('Only pending overtime requests can be cancelled', 400);
  await overtimeRepo.remove(id);
}

export async function approve(id: string, user: AuthUser) {
  if (!['admin', 'lead'].includes(user.role)) throw new AppError('Insufficient permissions', 403);

  const ot: any = await overtimeRepo.findWithEmployeeById(id);
  if (!ot) throw new AppError('Not found', 404);

  if (ot.employee_id === user.id) {
    throw new AppError('You cannot approve your own overtime request', 403);
  }
  if (ot.status !== 'pending') {
    throw new AppError('Only pending overtime requests can be reviewed', 400);
  }

  if (ot.request_type === 'planned') {
    // Pre-authorization only — the work hasn't happened (or hasn't been
    // reconciled) yet, so there's nothing to verify and nothing to pay.
    const won = await overtimeRepo.approvePlanned(id, user.id);
    if (!won) throw new AppError('This request was just reviewed by someone else', 409);
    notifyOvertimeStatusIfNeeded(ot.employee_id, 'approved', ot.work_date, Number(ot.hours));
    return { amount: null };
  }

  // 'worked' — always built from the exact clock sessions it claims now, so
  // the hours are guaranteed accurate by construction; nothing left to
  // verify here, just pay it.
  const emp = await employeeRepo.findPayrollBaseById(ot.employee_id);
  if (!emp?.salary) {
    throw new AppError("This employee's salary isn't configured yet — set it under Payroll first", 400);
  }

  const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
  const { hourlyRate, overtimeHourlyRate, amount } = calculateOvertimePay(monthlySalary, ot.hours);

  const won = await overtimeRepo.approve(id, user.id, { hourlyRate, overtimeRate: overtimeHourlyRate, amount, approvedDespiteMismatch: false });
  if (!won) {
    // Someone else reviewed it in the moment between the check above and
    // this write — stop here so payroll never gets a duplicate adjustment.
    throw new AppError('This request was just reviewed by someone else', 409);
  }

  const workDate = new Date(ot.work_date);
  const projectLabel = ot.project_name || 'General duties';
  await payrollAdjustmentRepo.create({
    employee_id: ot.employee_id,
    type: 'overtime_pay',
    title: `Overtime Pay — ${Number(ot.hours)}h @ 150% rate (${projectLabel})`,
    amount,
    year: workDate.getFullYear(),
    month: workDate.getMonth() + 1,
    reference_type: 'overtime_request',
    reference_id: ot.id,
    notes: `Hourly rate Rs. ${hourlyRate} × 1.5 = Rs. ${overtimeHourlyRate}/hr`,
  });

  notifyOvertimeStatusIfNeeded(ot.employee_id, 'approved', ot.work_date, Number(ot.hours));

  return { amount };
}

export async function reject(id: string, user: AuthUser) {
  if (!['admin', 'lead'].includes(user.role)) throw new AppError('Insufficient permissions', 403);

  const ot = await overtimeRepo.findById(id);
  if (!ot) throw new AppError('Not found', 404);

  if (ot.employee_id === user.id) {
    throw new AppError('You cannot reject your own overtime request', 403);
  }
  if (ot.status !== 'pending') {
    throw new AppError('Only pending overtime requests can be reviewed', 400);
  }

  const won = await overtimeRepo.reject(id, user.id);
  if (!won) {
    throw new AppError('This request was just reviewed by someone else', 409);
  }
  notifyOvertimeStatusIfNeeded(ot.employee_id, 'rejected', ot.work_date, Number(ot.hours));
}

// Only meaningful for 'planned' requests once their work_date has passed —
// pays for what was actually clocked, capped at what was pre-approved, so
// pre-approval sets a ceiling rather than a guarantee.
export async function reconcile(id: string, user: AuthUser) {
  if (!['admin', 'lead'].includes(user.role)) throw new AppError('Insufficient permissions', 403);

  const ot: any = await overtimeRepo.findWithEmployeeById(id);
  if (!ot) throw new AppError('Not found', 404);

  if (ot.employee_id === user.id) {
    throw new AppError('You cannot reconcile your own overtime request', 403);
  }
  if (ot.request_type !== 'planned') {
    throw new AppError('Only planned overtime requests need reconciliation', 400);
  }
  if (ot.status !== 'approved') {
    throw new AppError('Only approved requests can be reconciled', 400);
  }
  if (ot.reconciled_at) {
    throw new AppError('This request has already been reconciled', 400);
  }
  if (ot.work_date > nepalDateString()) {
    throw new AppError("This request's date hasn't arrived yet", 400);
  }

  const expectedShiftSeconds = await getExpectedShiftSeconds();
  if (expectedShiftSeconds == null) {
    throw new AppError('Configure company working hours before reconciling planned overtime', 400);
  }

  const { seconds: clockedSeconds, estimated: clockedSecondsEstimated } = await clockService.getTotalClockedSecondsForDate(ot.employee_id, ot.work_date);
  const impliedOvertimeHours = Math.max(0, clockedSeconds - expectedShiftSeconds) / 3600;
  const cappedHours = Math.min(Number(ot.hours), impliedOvertimeHours);
  const actualHours = Math.round(cappedHours * 2) / 2; // nearest half-hour, matching the form's input step

  const emp = await employeeRepo.findPayrollBaseById(ot.employee_id);
  if (!emp?.salary) {
    throw new AppError("This employee's salary isn't configured yet — set it under Payroll first", 400);
  }

  const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
  const { hourlyRate, overtimeHourlyRate, amount } = calculateOvertimePay(monthlySalary, actualHours);

  const won = await overtimeRepo.reconcile(id, user.id, { actualHours, hourlyRate, overtimeRate: overtimeHourlyRate, amount });
  if (!won) {
    throw new AppError('This request was already reconciled', 409);
  }

  if (actualHours > 0) {
    const workDate = new Date(ot.work_date);
    const projectLabel = ot.project_name || 'General duties';
    await payrollAdjustmentRepo.create({
      employee_id: ot.employee_id,
      type: 'overtime_pay',
      title: `Overtime Pay — ${actualHours}h @ 150% rate (${projectLabel}) — reconciled from ${Number(ot.hours)}h planned`,
      amount,
      year: workDate.getFullYear(),
      month: workDate.getMonth() + 1,
      reference_type: 'overtime_request',
      reference_id: ot.id,
      notes: `Hourly rate Rs. ${hourlyRate} × 1.5 = Rs. ${overtimeHourlyRate}/hr`
        + (clockedSecondsEstimated ? ' — that day\'s clock-out was auto-estimated, not actually reported by the employee' : ''),
    });
  }

  return { actualHours, amount: actualHours > 0 ? amount : 0, clockedSecondsEstimated };
}
