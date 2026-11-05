import * as onboardRepo from "../repositories/onboard.repository";
import AppError from "../pkg/AppError";
import path from "path";
import fs from "fs";
import * as employeeRepo from "../repositories/employee.repository";
import * as notificationPreferenceService from "./notificationPreference.service";
import nodemailer from "nodemailer";
import { resolveStoredPath, type OnboardFileField } from "../middleware/uplod";
import type { OnboardCreateInput, OnboardFilePaths } from "../dtos/onboard.dto";

//send email after sucessfull approve
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
      <p>Your onboarding profile for role ${role} has been accepted!</p>
      <p>Please log in via <a href="https://hr.gitgi.com/login" style="color:#4f46e5;font-weight:bold">https://hr.gitgi.com/login</a> and click <strong>"Forgot password"</strong> to get the reset link sent to your registered email address.</p>
      <p>If you have any questions, feel free to contact the HR department.</p>
      <p style="color:#888;font-size:12px">HR Platform</p>
    `,
  });
}

type ProfileFileKey = Extract<keyof NonNullable<onboardRepo.OnboardProfile>, `${string}_path`>;

// `GET /onboard/:id/:type` — which stored file each :type serves. The form field names are
// the canonical types; the short names are kept for the existing admin onboarding page.
const FILE_TYPES: Record<OnboardFileField | "photo" | "nda" | "citizenship" | "pan" | "certificate", ProfileFileKey> = {
  citizenshipFront: "citizenship_front_path",
  citizenshipBack: "citizenship_back_path",
  panFront: "pan_front_path",
  panBack: "pan_back_path",
  educational: "educational_document_path",
  additional: "additional_document_path",
  signedContract: "signed_contract_path",
  offerLetter: "offer_letter_path",
  otherEmployment: "other_employment_document_path",
  photo: "photo_path",
  nda: "signed_contract_path",
  citizenship: "citizenship_front_path",
  pan: "pan_front_path",
  certificate: "educational_document_path",
};

/** Best-effort removal of uploaded files given their DB-stored relative paths. */
export async function deleteStoredFiles(storedPaths: string[]) {
  await Promise.all(
    storedPaths.map(async (stored) => {
      const absolute = resolveStoredPath(stored);
      if (!absolute) return;
      try {
        await fs.promises.unlink(absolute);
      } catch (err: any) {
        if (err?.code !== "ENOENT") {
          console.error(`Failed to delete uploaded file ${stored}:`, err);
        }
      }
    }),
  );
}

export async function get(type: "intern" | "employee" | "all") {
  return onboardRepo.getOnboardProfile(type);
}

export async function getDraft(email: string) {
  return onboardRepo.getDraftByEmail(email);
}

export async function create(input: OnboardCreateInput, filePaths: OnboardFilePaths) {
  const { replacedFilePaths } = await onboardRepo.saveOnboardProfile(input, filePaths);
  // A resubmission overwrites the earlier row — drop the files it no longer points to
  await deleteStoredFiles(replacedFilePaths);
}

export async function approve(onboardId: number) {
  const profile = await onboardRepo.approveOnboardProfile(onboardId);
  // console.log(profile);
  if (!process.env.MAIL_HOST) {
    console.info(
      `[auth] MAIL_HOST not set — Failed to send notification mail to ${profile.email}`,
    );
  } else if (await notificationPreferenceService.isEnabled(profile.id, 'onboarding_updated')) {
    try {
      await sendApproveMail(profile.name, profile.email, profile.role);
    } catch (mailErr: any) {
      console.error("[auth] Failed to send reset email:", mailErr.message);
    }
  }

  const year = new Date().getFullYear();
  await employeeRepo.seedLeaveBalances(profile.id, year);
  return profile;
}

export async function remove(id: number) {
  const { filePaths } = await onboardRepo.deleteOnboardProfile(id);
  await deleteStoredFiles(filePaths);
  return { message: "Onboarding profile rejected and removed sucessfully." };
}

export async function getContractFilePath(actor: any, id: number, type: string) {
  // if(actor.role !== 'intern') throw new AppError(`${actor.role} cannot access the file`)

  const column = Object.prototype.hasOwnProperty.call(FILE_TYPES, type) ? FILE_TYPES[type as keyof typeof FILE_TYPES] : undefined;
  if (!column) throw new AppError("Invalid File Type", 400);

  const profile = await onboardRepo.getOnboardProfileById(id);
  const stored = profile?.[column];
  if (!stored) {
    throw new AppError("File not found.", 404);
  }

  const filePath = resolveStoredPath(stored);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new AppError("File is missing.", 404);
  }

  return { filePath, filename: path.basename(stored) };
}

export async function onboardAdmin(name: string, email:string, role: string, g:string) {
  const id = await onboardRepo.addAdmin(name, email, role,g);
  return { id };
}
