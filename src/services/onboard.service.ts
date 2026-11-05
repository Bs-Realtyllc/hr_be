import * as onboardRepo from "../repositories/onboard.repository";
import AppError from "../pkg/AppError";
import path from "path";
import fs from "fs";
import * as employeeRepo from "../repositories/employee.repository";
import * as notificationPreferenceService from "./notificationPreference.service";
import nodemailer from "nodemailer";
import { OnboardFilenames } from "../repositories/onboard.repository";

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

export async function get(type: "intern" | "employee" | "all") {
  return onboardRepo.getOnboardProfile(type);
}

export async function getDraft(email: string) {
  return onboardRepo.getDraftByEmail(email);
}

export async function create(
  data: string | Record<string, any>,
  filenames: OnboardFilenames,
) {
  const raw = typeof data === "string" ? data : data.payload;
  let parsedData: any;
  try {
    parsedData = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new AppError("payload must be valid JSON.", 400);
  }
  if (!parsedData || typeof parsedData !== "object") {
    throw new AppError("payload is required.", 400);
  }
  return onboardRepo.saveOnboardProfile(parsedData, filenames);
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

export async function deactivateOnboardProfile(id: number) {
  return onboardRepo.deactivateOnboardProfile(id);
}

const NDA_DIR = path.join(process.cwd(), "uploads/nda");
const PHOTO_DIR = path.join(process.cwd(), "uploads/profile/photo");
const ID_DIR = path.join(process.cwd(), "uploads/profile/id");
const PAN_DIR = path.join(process.cwd(), "uploads/profile/PAN");
const ADDITIONAL_DIR = path.join(process.cwd(), "uploads/profile/additional");
const OTHER_DIR = path.join(process.cwd(), "uploads/profile/other");
const CERTIFICATE_DIR = path.join(process.cwd(), "uploads/profile/certificate");
const EXPERIENCE_DIR = path.join(process.cwd(), "uploads/profile/experience");

/**
 * Resolves an uploaded file for the viewer. `type` is the upload field name,
 * e.g. "idFront", "educationCertificate_0" or "experienceLetter_1".
 */
export async function getContractFilePath(id: number, type: string) {
  const files = await onboardRepo.getOnboardFiles(id);
  if (!files) throw new AppError("File not found.", 404);

  const map = [
    { name: "passportPhoto", filename: files.photoPath, directory: PHOTO_DIR },
    { name: "idFront", filename: files.idFrontPath, directory: ID_DIR },
    { name: "idBack", filename: files.idBackPath, directory: ID_DIR },
    { name: "panFront", filename: files.panFrontPath, directory: PAN_DIR },
    { name: "panBack", filename: files.panBackPath, directory: PAN_DIR },
    { name: "additionalDocument", filename: files.additionalDocumentPath, directory: ADDITIONAL_DIR },
    { name: "contract", filename: files.contractPath, directory: NDA_DIR },
    { name: "otherDocument", filename: files.otherDocumentPath, directory: OTHER_DIR },
    ...(files.educationInfo ?? []).map((entry, i) => ({
      name: `educationCertificate_${i}`,
      filename: entry?.certificate,
      directory: CERTIFICATE_DIR,
    })),
    ...(files.previousExperienceInfo ?? []).map((entry, i) => ({
      name: `experienceLetter_${i}`,
      filename: entry?.experience_letter,
      directory: EXPERIENCE_DIR,
    })),
  ];
  const fileType = map.find((m) => m.name === type);

  if (!fileType?.filename) {
    throw new AppError("File not found.", 404);
  }

  const filePath = path.join(fileType.directory, fileType.filename);

  if (!fs.existsSync(filePath)) {
    throw new AppError("File is missing.", 404);
  }

  return { filePath, filename: fileType.filename };
}

export async function onboardAdmin(name: string, email:string, role: string, g:string) {
  const id = await onboardRepo.addAdmin(name, email, role,g);
  return { id };
}
