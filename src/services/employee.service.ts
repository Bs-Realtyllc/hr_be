import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import * as employeeRepo from "../repositories/employee.repository";
import * as positionRepo from "../repositories/position.repository";
import * as payrollAdjustmentRepo from "../repositories/payrollAdjustment.repository";
import * as notificationPreferenceService from "./notificationPreference.service";
import { sendPlatformMail } from "../pkg/mailer";
import type {
  EmployeeCreateInput,
  EmployeeUpdateInput,
} from "../dtos/employee.dto";
import AppError from "../pkg/AppError";
import {
  buildApprovalEmailSubject,
  buildApprovalEmailHtml,
  buildRejectionEmailSubject,
  buildRejectionEmailHtml,
} from "./onboardingEmailTemplate";
import { NewEmployee } from "../../drizzle/schema";

//send email after sucessfull entry
export async function sendApproveMail(name: string, to: string, role: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: "HR Platform — Onboarding sucessfull",
    html: `
      <p>Hi ${name},</p>
      <p>You have been added to gitgi.com for the role ${role}!</p>
      <p>Please log in via <a href="https://hr.gitgi.com/login" style="color:#4f46e5;font-weight:bold">https://hr.gitgi.com/login</a> and click <strong>"Forgot password"</strong> to get the reset link sent to your registered email address.</p>
      <p>If you have any questions, feel free to contact the HR department.</p>
      <p style="color:#888;font-size:12px">HR Platform</p>
    `,
  });
}
//send email after sucessfull entry in bulk
export async function sendApproveMailBulk(emails: string[]) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    bcc: emails,
    subject: "HR Platform — Onboarding sucessfull",
    html: `
      <p>Hi,</p>

      <p>
        You have been successfully added to gitgi.com.
      </p>

      <p>
        Please log in via
        <a
          href="https://hr.gitgi.com/login"
          style="color:#4f46e5;font-weight:bold"
        >
          https://hr.gitgi.com/login
        </a>
        and click <strong>"Forgot password"</strong>
        to get the reset link sent to your registered email address.
      </p>

      <p>
        If you have any questions, feel free to contact the HR department.
      </p>

      <p style="color:#888;font-size:12px">
        HR Platform
      </p>
    `,
  });
}

export async function list() {
  return employeeRepo.findAllActive();
}

export async function listAllNames() {
  return employeeRepo.findAllActiveNames();
}

export async function listStaffNames() {
  return employeeRepo.findActiveStaffNames();
}

export async function listTeamAccess() {
  return employeeRepo.findForTeamAccess();
}

export async function listOnboarding() {
  return employeeRepo.findAllOnboarding();
}

export async function get(id: string) {
  return employeeRepo.findById(id);
}

export async function create(
  data: EmployeeCreateInput,
  actorId: number | null,
) {
  const result = await employeeRepo.create(data, actorId);

  // console.log(result)
  const year = new Date().getFullYear();
  await employeeRepo.seedLeaveBalances(result.id, year);

  if (process.env.MAIL_HOST) {
    try {
      await sendApproveMail(result.name, result.email, result.role);
    } catch (mailErr: any) {
      console.error("[auth] Failed to send reset email:", mailErr.message);
    }
  } else {
    console.info(
      `[auth] MAIL_HOST not set — Failed to send notification mail to ${result.email}`,
    );
  }

  return result;
}

export async function update(
  id: string,
  updates: EmployeeUpdateInput,
  actorId: number | null,
  actorRole: string | null = null,
) {
  if (!Object.keys(updates).length) {
    throw new AppError("Nothing to update", 400);
  }

  if ("role" in updates) {
    // Blocked regardless of caller — self-service role changes are how an
    // admin accidentally locks themselves out, since the UI-only disable on
    // this button can always be bypassed by calling the API directly.
    if (actorId != null && String(actorId) === String(id)) {
      throw new AppError("You cannot change your own role", 400);
    }
    if (actorRole !== "admin") {
      throw new AppError("Only an admin can change an employee's role", 403);
    }
  }

  await employeeRepo.update(id, updates, actorId);
}

export async function remove(id: string, actorId: number | null) {
  await employeeRepo.deactivate(id, actorId);
}

export async function listPositions(employeeId: string) {
  return positionRepo.findPositionsForEmployee(employeeId);
}

export async function addPosition(employeeId: string, positionId: number, isPrimary: boolean) {
  const position = await positionRepo.findById(positionId);
  if (!position) throw new AppError("Position not found", 404);

  const existingIncumbent = await positionRepo.findIncumbent(positionId);
  if (existingIncumbent) {
    throw new AppError(
      String(existingIncumbent.id) === String(employeeId)
        ? "This employee already holds this position"
        : `${existingIncumbent.name} already holds this position`,
      400
    );
  }

  const employee = await employeeRepo.findById(employeeId);
  await positionRepo.addPosition(employeeId, positionId, isPrimary);

  if (employee && isPrimary) notifyPositionChangedIfNeeded(employee, position);
}

export async function removePosition(employeeId: string, positionId: number) {
  const positions = await positionRepo.findPositionsForEmployee(employeeId);
  const target = positions.find((p) => p.id === positionId);
  if (!target) throw new AppError("Employee does not hold this position", 404);

  await positionRepo.removePosition(employeeId, positionId);

  if (target.is_primary) {
    const employee = await employeeRepo.findById(employeeId);
    if (employee) notifyPositionChangedIfNeeded(employee, null);
  }
}

export async function setPrimaryPosition(employeeId: string, positionId: number) {
  const positions = await positionRepo.findPositionsForEmployee(employeeId);
  const target = positions.find((p) => p.id === positionId);
  if (!target) throw new AppError("Employee does not hold this position", 404);
  if (target.is_primary) return;

  await positionRepo.setPrimaryPosition(employeeId, positionId);

  const employee = await employeeRepo.findById(employeeId);
  if (employee) notifyPositionChangedIfNeeded(employee, target);
}

async function notifyPositionChangedIfNeeded(
  employee: { id: number; name: string; email: string },
  position: { title: string; department_name?: string } | null,
) {
  if (!process.env.MAIL_HOST) return;
  try {
    const enabled = await notificationPreferenceService.isEnabled(employee.id, "employee_updates");
    if (!enabled) return;
    const description = position
      ? `<strong>${position.title}</strong>${position.department_name ? ` (${position.department_name})` : ''}`
      : 'unassigned';
    await sendPlatformMail(
      employee.email,
      "HR Platform — Your Position Changed",
      `<p>Hi ${employee.name},</p>
       <p>Your position was updated to ${description}.</p>
       <p>If you have questions about this change, contact HR.</p>
       <p style="color:#888;font-size:12px">HR Platform</p>`,
    );
  } catch (err: any) {
    console.error(`[employee] Failed to send position-changed email for ${employee.id}:`, err.message);
  }
}

const TEMP_PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 10): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += TEMP_PASSWORD_CHARS[crypto.randomInt(TEMP_PASSWORD_CHARS.length)];
  }
  return result;
}

async function sendApprovalEmail(
  name: string,
  to: string,
  tempPassword: string,
) {
  const loginUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/login`
    : "http://localhost:6001/login";

  if (!process.env.MAIL_HOST) {
    console.info(
      `[employee] MAIL_HOST not set — temp password for ${to}: ${tempPassword}`,
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
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
    console.info(
      `[employee] MAIL_HOST not set — skipping rejection email to ${to}`,
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
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
  if (!employee) throw new AppError("Not found", 404);
  if (employee.status !== "onboarding") {
    throw new AppError("Only pending applicants can be approved", 400);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await employeeRepo.approve(id, passwordHash, actorId);

  try {
    await sendApprovalEmail(employee.name, employee.email, tempPassword);
  } catch (err: any) {
    console.error(
      `[employee] Failed to send approval email for ${id}:`,
      err.message,
    );
  }
}

export async function reject(id: string, notify: boolean) {
  const employee = await employeeRepo.findById(id);
  if (!employee) throw new AppError("Not found", 404);
  if (employee.status !== "onboarding") {
    throw new AppError("Only pending applicants can be rejected", 400);
  }

  if (notify) {
    try {
      await sendRejectionEmail(employee.name, employee.email);
    } catch (err: any) {
      console.error(
        `[employee] Failed to send rejection email for ${id}:`,
        err.message,
      );
    }
  }

  await employeeRepo.reject(id);
}

export async function payrollSummary(id: string) {
  const emp = await employeeRepo.findPayrollBaseById(id);
  if (!emp) {
    const err: any = new Error("Not found");
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

  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const leaveRanges = await employeeRepo.findApprovedLeaveRangesForEmployee(
    id,
    monthStart,
    monthEnd,
  );

  let leaveDays = 0;
  for (const lr of leaveRanges as any[]) {
    const s = new Date(
      Math.max(
        new Date(lr.start_date).getTime(),
        new Date(monthStart).getTime(),
      ),
    );
    const e = new Date(
      Math.min(new Date(lr.end_date).getTime(), new Date(monthEnd).getTime()),
    );
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) leaveDays++;
    }
  }

  const presentDays = workingDays - leaveDays;
  const dailyRate = emp.salary ? Number(emp.salary) / workingDays : 0;
  const expectedPay = dailyRate * presentDays;

  const adjustments = await payrollAdjustmentRepo.findForEmployeePeriod(
    id,
    year,
    month + 1,
  );
  const overtimePay = adjustments
    .filter((a: any) => a.type === "overtime_pay")
    .reduce((s: number, a: any) => s + Number(a.amount), 0);
  const leaveDeduction = adjustments
    .filter((a: any) => a.type === "leave_deduction")
    .reduce((s: number, a: any) => s + Number(a.amount), 0);
  const leaveBonus = adjustments
    .filter((a: any) => a.type === "leave_bonus")
    .reduce((s: number, a: any) => s + Number(a.amount), 0);

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
    net_pay: Math.round(
      expectedPay + overtimePay + leaveDeduction + leaveBonus,
    ),
    adjustments: adjustments.map((a: any) => ({
      title: a.title,
      type: a.type,
      amount: Number(a.amount),
    })),
  };
}

export async function createBulk(data: NewEmployee[], actorId: number | null) {
  if (data.length < 1) throw new AppError("No rows to add employee", 400);
  const result = await employeeRepo.createBulk(data, actorId);
  const emails = result.map((r) => r.email);

  // console.log(result)
  const year = new Date().getFullYear();
  for (let r of result) {
    await employeeRepo.seedLeaveBalances(r.id, year);
  }

  if (process.env.MAIL_HOST) {
    try {
      await sendApproveMailBulk(emails);
    } catch (mailErr: any) {
      console.error("[auth] Failed to send reset email:", mailErr.message);
    }
  } else {
    emails.map((email) => {
      console.info(
        `[auth] MAIL_HOST not set — Failed to send notification mail to ${email}`,
      );
    });
  }

  return result;
}
