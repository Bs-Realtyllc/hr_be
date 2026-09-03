import * as onboardRepo from "../repositories/onboard.repository";
import AppError from "../pkg/AppError";
import path from "path";
import fs from "fs";

interface OnboardFilenames {
  contract: string;
  citizenshipFront: string;
  citizenshipBack: string;
  panCard: string;
  passoutCertificate: string;
  passportPhoto: string;
}

const NDA_DIR = path.join(process.cwd(), "uploads/nda");
const PHOTO_DIR = path.join(process.cwd(), "uploads/profile/photo");
const CITIZENSHIP_DIR = path.join(process.cwd(), "uploads/profile/citizenship");
const CERTIFICATE_DIR = path.join(process.cwd(), "uploads/profile/certificate");
const PAN_DIR = path.join(process.cwd(), "uploads/profile/PAN");

export async function get(type: "intern" | "employee" | "all") {
  return onboardRepo.getOnboardProfile(type);
}

// export async function getById(id : number) {
//   return onboardRepo.getOnboardProfileById(id);
// }

export async function create(
  data: string | Record<string, any>,
  filenames: OnboardFilenames,
) {
  const raw = typeof data === "string" ? data : data.payload;
  const parsedData = typeof raw === "string" ? JSON.parse(raw) : raw;
  return onboardRepo.saveOnboardProfile(parsedData, filenames);
}

export async function approve(id: number) {
  return onboardRepo.approveOnboardProfile(id);
}

export async function remove(id: number) {
  return onboardRepo.deleteOnboardProfile(id);
}

export async function getContractFilePath(
  id: number,
  type: "photo" | "nda" | "citizenship" | "pan" | "certificate",
) {
  const map = [
    { name: "nda", typePath: "nda_path" , directory: NDA_DIR},
    { name: "photo", typePath: "photo_path" , directory: PHOTO_DIR},
    { name: "citizenship", typePath: "citizenship_front_path" , directory: CITIZENSHIP_DIR},
    { name: "certificate", typePath: "passout_certificate_path" , directory: CERTIFICATE_DIR},
    { name: "pan", typePath: "pan_path" , directory: PAN_DIR},
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
