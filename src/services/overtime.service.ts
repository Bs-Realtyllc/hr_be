import * as overtimeRepo from '../repositories/overtime.repository';
import * as employeeRepo from '../repositories/employee.repository';
import * as payrollAdjustmentRepo from '../repositories/payrollAdjustment.repository';
import * as notificationPreferenceService from './notificationPreference.service';
import AppError from '../pkg/AppError';
import type { OvertimeCreateInput, OvertimeUpdateInput } from '../dtos/overtime.dto';
import { toMonthlySalary, calculateOvertimePay } from '../pkg/payrollCalculator';
import { sendPlatformMail } from '../pkg/mailer';

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
  return overtimeRepo.findWithNames({ employeeId: filterEmployeeId, status });
}

export async function create(data: OvertimeCreateInput) {
  const id = await overtimeRepo.create(data);
  notifyApproversOfNewOvertimeRequest(data.employee_id, data.work_date, data.hours);
  return id;
}

export async function update(id: string, updates: OvertimeUpdateInput, userId: number) {
  const ot = await overtimeRepo.findById(id);
  if (!ot) throw new AppError('Not found', 404);
  if (ot.employee_id !== userId) throw new AppError('You can only edit your own overtime requests', 403);
  if (ot.status !== 'pending') throw new AppError('Only pending overtime requests can be edited', 400);
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

  if (user.role === 'lead' && ot.employee_id === user.id) {
    throw new AppError('Team leads cannot approve their own overtime requests', 403);
  }
  if (ot.status !== 'pending') {
    throw new AppError('Only pending overtime requests can be reviewed', 400);
  }

  const emp = await employeeRepo.findPayrollBaseById(ot.employee_id);
  if (!emp?.salary) {
    throw new AppError("This employee's salary isn't configured yet — set it under Payroll first", 400);
  }

  const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
  const { hourlyRate, overtimeHourlyRate, amount } = calculateOvertimePay(monthlySalary, ot.hours);

  await overtimeRepo.approve(id, user.id, { hourlyRate, overtimeRate: overtimeHourlyRate, amount });

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

  if (user.role === 'lead' && ot.employee_id === user.id) {
    throw new AppError('Team leads cannot reject their own overtime requests', 403);
  }
  if (ot.status !== 'pending') {
    throw new AppError('Only pending overtime requests can be reviewed', 400);
  }

  await overtimeRepo.reject(id, user.id);
  notifyOvertimeStatusIfNeeded(ot.employee_id, 'rejected', ot.work_date, Number(ot.hours));
}
