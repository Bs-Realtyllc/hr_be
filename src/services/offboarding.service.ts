import * as offboardingRepo from "../repositories/offboarding.repository";
import * as employeeRepo from "../repositories/employee.repository";
import * as notificationPreferenceService from "./notificationPreference.service";
import { sendPlatformMail } from "../pkg/mailer";
import AppError from "../pkg/AppError";
import type { OffboardingInitiateInput } from "../dtos/offboarding.dto";

async function notifyEmployee(employeeId: number, subject: string, html: string) {
  if (!process.env.MAIL_HOST) return;
  const employee = await employeeRepo.findById(employeeId);
  if (!employee) return;
  try {
    const enabled = await notificationPreferenceService.isEnabled(employee.id, "offboarding_updated");
    if (!enabled) return;
    await sendPlatformMail(employee.email, subject, html);
  } catch (err: any) {
    console.error(`[offboarding] Failed to send notification for employee ${employeeId}:`, err.message);
  }
}

export async function initiate(input: OffboardingInitiateInput, actorId: number | null) {
  const id = await offboardingRepo.initiate(
    {
      emp_id: input.employeeId,
      exit_type: input.exitType,
      reason: input.reason,
      notice_date: input.noticeDate,
      last_working_day: input.lastWorkingDay,
    },
    actorId,
  );

  await notifyEmployee(
    input.employeeId,
    "HR Platform — Offboarding Started",
    `<p>Your offboarding process has been initiated, with a last working day of <strong>${input.lastWorkingDay}</strong>.</p>
     <p>HR will reach out with the exit checklist. If you have questions, contact HR.</p>
     <p style="color:#888;font-size:12px">HR Platform</p>`,
  );

  return offboardingRepo.findById(id);
}

export async function get(id: number) {
  const offboarding = await offboardingRepo.findById(id);
  if (!offboarding) throw new AppError("Offboarding record not found", 404);
  const tasks = await offboardingRepo.listTasks(id);
  return { ...offboarding, tasks };
}

export async function list(status?: string) {
  return offboardingRepo.list(status);
}

export async function listByEmployee(employeeId: number) {
  return offboardingRepo.listByEmployee(employeeId);
}

export async function updateTask(
  offboardingId: number,
  taskId: number,
  status: "pending" | "completed" | "not_applicable",
  notes: string | undefined,
  actorId: number | null,
) {
  await offboardingRepo.updateTask(offboardingId, taskId, { status, notes }, actorId);
  return offboardingRepo.listTasks(offboardingId);
}

export async function complete(offboardingId: number, relievingLetterPath: string | null, actorId: number | null) {
  const offboarding = await offboardingRepo.complete(offboardingId, relievingLetterPath, actorId);

  await notifyEmployee(
    offboarding.emp_id,
    "HR Platform — Offboarding Complete",
    `<p>Your offboarding has been completed. Your access to the HR platform has been revoked as of your last working day.</p>
     <p>If you need your relieving letter or have further questions, contact HR.</p>
     <p style="color:#888;font-size:12px">HR Platform</p>`,
  );

  return offboarding;
}

export async function cancel(offboardingId: number, actorId: number | null) {
  return offboardingRepo.cancel(offboardingId, actorId);
}
