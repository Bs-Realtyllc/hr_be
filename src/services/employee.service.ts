import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import * as employeeRepo from '../repositories/employee.repository';
import * as payrollAdjustmentRepo from '../repositories/payrollAdjustment.repository';
import * as employeeTaxRepo from '../repositories/employeeTax.repository';
import { withTaxEstimate } from './payroll.service';
import type { EmployeeCreateInput, EmployeeUpdateInput } from '../dtos/employee.dto';
import AppError from '../pkg/AppError';
import {
  buildApprovalEmailSubject,
  buildApprovalEmailHtml,
  buildRejectionEmailSubject,
  buildRejectionEmailHtml,
} from './onboardingEmailTemplate';

export async function list() {
  return employeeRepo.findAllActive();
}

export async function listOnboarding() {
  return employeeRepo.findAllOnboarding();
}

export async function get(id: string) {
  return employeeRepo.findById(id);
}

export async function create(data: EmployeeCreateInput, actorId: number | null) {
  const id = await employeeRepo.create(data, actorId);

  const year = new Date().getFullYear();
  await employeeRepo.seedLeaveBalances(id, year);

  return id;
}

export async function update(id: string, updates: EmployeeUpdateInput, actorId: number | null) {
  if (!Object.keys(updates).length) {
    throw new AppError('Nothing to update', 400);
  }
  await employeeRepo.update(id, updates, actorId);
}

export async function remove(id: string, actorId: number | null) {
  await employeeRepo.deactivate(id, actorId);
}

const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generateTempPassword(length = 10): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += TEMP_PASSWORD_CHARS[crypto.randomInt(TEMP_PASSWORD_CHARS.length)];
  }
  return result;
}

async function sendApprovalEmail(name: string, to: string, tempPassword: string) {
  const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:6001/login';

  if (!process.env.MAIL_HOST) {
    console.info(`[employee] MAIL_HOST not set — temp password for ${to}: ${tempPassword}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: buildApprovalEmailSubject(),
    html: buildApprovalEmailHtml(name, to, tempPassword, loginUrl),
  });
}

async function sendRejectionEmail(name: string, to: string) {
  if (!process.env.MAIL_HOST) {
    console.info(`[employee] MAIL_HOST not set — skipping rejection email to ${to}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: buildRejectionEmailSubject(),
    html: buildRejectionEmailHtml(name),
  });
}

export async function approve(id: string, actorId: number | null) {
  const employee = await employeeRepo.findById(id);
  if (!employee) throw new AppError('Not found', 404);
  if (employee.status !== 'onboarding') {
    throw new AppError('Only pending applicants can be approved', 400);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await employeeRepo.approve(id, passwordHash, actorId);

  try {
    await sendApprovalEmail(employee.name, employee.email, tempPassword);
  } catch (err: any) {
    console.error(`[employee] Failed to send approval email for ${id}:`, err.message);
  }
}

export async function reject(id: string, notify: boolean) {
  const employee = await employeeRepo.findById(id);
  if (!employee) throw new AppError('Not found', 404);
  if (employee.status !== 'onboarding') {
    throw new AppError('Only pending applicants can be rejected', 400);
  }

  if (notify) {
    try {
      await sendRejectionEmail(employee.name, employee.email);
    } catch (err: any) {
      console.error(`[employee] Failed to send rejection email for ${id}:`, err.message);
    }
  }

  await employeeRepo.reject(id);
}

export async function payrollSummary(id: string) {
  const emp = await employeeRepo.findPayrollBaseById(id);
  if (!emp) {
    const err: any = new Error('Not found');
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const leaveRanges = await employeeRepo.findApprovedLeaveRangesForEmployee(id, monthStart, monthEnd);

  let leaveDays = 0;
  for (const lr of leaveRanges as any[]) {
    const s = new Date(Math.max(new Date(lr.start_date).getTime(), new Date(monthStart).getTime()));
    const e = new Date(Math.min(new Date(lr.end_date).getTime(), new Date(monthEnd).getTime()));
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) leaveDays++;
    }
  }

  const presentDays = workingDays - leaveDays;
  const dailyRate = emp.salary ? Number(emp.salary) / workingDays : 0;
  const expectedPay = dailyRate * presentDays;

  const adjustments = await payrollAdjustmentRepo.findForEmployeePeriod(id, year, month + 1);
  const overtimePay = adjustments.filter((a: any) => a.type === 'overtime_pay').reduce((s: number, a: any) => s + Number(a.amount), 0);
  const leaveDeduction = adjustments.filter((a: any) => a.type === 'leave_deduction').reduce((s: number, a: any) => s + Number(a.amount), 0);
  const leaveBonus = adjustments.filter((a: any) => a.type === 'leave_bonus').reduce((s: number, a: any) => s + Number(a.amount), 0);

  return {
    ...emp,
    working_days_this_month: workingDays,
    leave_days_this_month: leaveDays,
    present_days: presentDays,
    daily_rate: Math.round(dailyRate),
    expected_pay: Math.round(expectedPay),
    overtime_pay: Math.round(overtimePay),
    leave_deduction: Math.round(leaveDeduction),
    leave_bonus: Math.round(leaveBonus),
    net_pay: Math.round(expectedPay + overtimePay + leaveDeduction + leaveBonus),
    adjustments: adjustments.map((a: any) => ({ title: a.title, type: a.type, amount: Number(a.amount) })),
  };
}

export async function getTaxProfile(id: string, userId: number, role: string) {
  const isSelf = Number(userId) === Number(id);
  const isPrivileged = ['admin', 'lead'].includes(role);
  if (!isSelf && !isPrivileged) {
    throw new AppError('Access denied: Tax profile information is restricted', 403);
  }

  const rows = await employeeTaxRepo.findAllWithProfile(id);
  if (!rows || rows.length === 0) {
    return null;
  }
  return withTaxEstimate(rows[0]);
}

export async function getCompensationHistory(id: string, userId: number, role: string) {
  const isSelf = Number(userId) === Number(id);
  const isPrivileged = ['admin', 'lead'].includes(role);
  if (!isSelf && !isPrivileged) {
    throw new AppError('Access denied: Compensation history is restricted', 403);
  }

  return employeeRepo.findCompensationHistory(id);
}

