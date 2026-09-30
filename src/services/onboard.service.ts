import * as onboardRepo from "../repositories/onboard.repository";
import AppError from "../pkg/AppError";
import path from "path";
import fs from "fs";
import * as employeeRepo from "../repositories/employee.repository";
import nodemailer from "nodemailer";

interface OnboardFilenames {
  contract: string;
  citizenshipFront: string;
  citizenshipBack: string;
  panCard: string;
  passoutCertificate: string;
  passportPhoto: string;
}

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

const NDA_DIR = path.join(process.cwd(), "uploads/nda");
const PHOTO_DIR = path.join(process.cwd(), "uploads/profile/photo");
const CITIZENSHIP_DIR = path.join(process.cwd(), "uploads/profile/citizenship");
const CERTIFICATE_DIR = path.join(process.cwd(), "uploads/profile/certificate");
const PAN_DIR = path.join(process.cwd(), "uploads/profile/PAN");

export async function get(type: "intern" | "employee" | "all") {
  return onboardRepo.getOnboardProfile(type);
}

export async function create(
  data: string | Record<string, any>,
  filenames: OnboardFilenames,
) {
  const raw = typeof data === "string" ? data : data.payload;
  const parsedData = typeof raw === "string" ? JSON.parse(raw) : raw;
  return onboardRepo.saveOnboardProfile(parsedData, filenames);
}

export async function approve(onboardId: number) {
  const profile = await onboardRepo.approveOnboardProfile(onboardId);
  // console.log(profile);
  if (process.env.MAIL_HOST) {
    try {
      await sendApproveMail(profile.name, profile.email, profile.role);
    } catch (mailErr: any) {
      console.error("[auth] Failed to send reset email:", mailErr.message);
    }
  } else {
    console.info(
      `[auth] MAIL_HOST not set — Failed to send notification mail to ${profile.email}`,
    );
  }

  const year = new Date().getFullYear();
  await employeeRepo.seedLeaveBalances(profile.id, year);
  return profile;
}

export async function remove(id: number) {
  return onboardRepo.deleteOnboardProfile(id);
}

export async function getContractFilePath(
  actor: any,
  id: number,
  type: "photo" | "nda" | "citizenship" | "pan" | "certificate",
) {
  // if(actor.role !== 'intern') throw new AppError(`${actor.role} cannot access the file`)

  const map = [
    { name: "nda", typePath: "nda_path", directory: NDA_DIR },
    { name: "photo", typePath: "photo_path", directory: PHOTO_DIR },
    {
      name: "citizenship",
      typePath: "citizenship_front_path",
      directory: CITIZENSHIP_DIR,
    },
    {
      name: "certificate",
      typePath: "passout_certificate_path",
      directory: CERTIFICATE_DIR,
    },
    { name: "pan", typePath: "pan_path", directory: PAN_DIR },
  ];
  const fileType = map.find((m) => m.name === type);

  if (!fileType) throw new AppError("Invalid File Type", 400);
  const profile = await onboardRepo.getOnboardProfileById(id);

  if (!profile || !profile[fileType.typePath]) {
    throw new AppError("File not found.", 404);
  }

  const filePath = path.join(fileType.directory, profile[fileType.typePath]);

  if (!fs.existsSync(filePath)) {
    throw new AppError("File is missing.", 404);
  }

  return { filePath, filename: profile[fileType.typePath] };
}
