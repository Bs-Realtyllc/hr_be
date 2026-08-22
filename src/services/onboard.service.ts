import * as onboardRepo from "../repositories/onboard.repository";
import AppError from "../pkg/AppError";
import path from "path";
import fs from "fs";


const UPLOADS_DIR = path.join(process.cwd(), "uploads/nda");


export async function get(type: "intern" | "employee" | "all") {
  return onboardRepo.getOnboardProfile(type);
}

// export async function getById(id : number) {
//   return onboardRepo.getOnboardProfileById(id);
// } 

export async function create(
  data: string | Record<string, any>,
  filename: string,
) {
  const raw = typeof data === "string" ? data : data.payload;
  const parsedData = typeof raw === "string" ? JSON.parse(raw) : raw;
  return onboardRepo.saveOnboardProfile(parsedData, filename);
}

export async function approve(id: number) {
  return onboardRepo.approveOnboardProfile(id);
}

export async function remove(id: number) {
  return onboardRepo.deleteOnboardProfile(id);
}

export async function getContractFilePath(id: number) {
  const profile = await onboardRepo.getOnboardProfileById(id);

  if (!profile || !profile.nda_path) {
    throw new AppError("Contract not found.", 404);
  }

  const filePath = path.join(UPLOADS_DIR, profile.nda_path);

  if (!fs.existsSync(filePath)) {
    throw new AppError("Contract file is missing.", 404);
  }

  return { filePath, filename: profile.nda_path };
}