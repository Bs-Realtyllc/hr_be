import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { employeeOnboardingProfile, employees } from "../models";
import AppError from "../pkg/AppError";
import fs from 'fs/promises';
import path from 'path';

interface OnboardFilenames {
  contract: string;
  citizenshipFront: string;
  citizenshipBack: string;
  panCard: string;
  passoutCertificate: string;
  passportPhoto: string;
}

type OnboardInsert = typeof employeeOnboardingProfile.$inferInsert;

type OnboardPayload = Omit<
  OnboardInsert,
  | "nda_path"
  | "citizenship_front_path"
  | "citizenship_back_path"
  | "pan_path"
  | "passout_certificate_path"
  | "photo_path"
>;

export async function getOnboardProfile(type: "intern" | "employee" | "all") {
  const result =
    type === "all"
      ? await db.select().from(employeeOnboardingProfile) // no filter → all rows
      : await db
          .select()
          .from(employeeOnboardingProfile)
          .where(eq(employeeOnboardingProfile.role, type)); // filtered by role

  return result;
}

export async function getOnboardProfileById(id: number) {
  const [profile] = await db
    .select()
    .from(employeeOnboardingProfile)
    .where(eq(employeeOnboardingProfile.id, id)); // filtered by id

  return profile;
}

export async function saveOnboardProfile(
  data: OnboardPayload,
  filenames: OnboardFilenames,
) {
  try {
    return await db.insert(employeeOnboardingProfile).values({
      ...data,
      nda_path: filenames.contract,
      citizenship_front_path: filenames.citizenshipFront,
      citizenship_back_path: filenames.citizenshipBack,
      pan_path: filenames.panCard,
      passout_certificate_path: filenames.passoutCertificate,
      photo_path: filenames.passportPhoto,
    } as typeof employeeOnboardingProfile.$inferInsert);
  } catch (err) {
    throw new AppError(
      err?.cause?.sqlMessage ?? err.message ?? "Failed to save profile",
      400,
    );
  }
}
export async function approveOnboardProfile(id: number) {
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .select()
      .from(employeeOnboardingProfile)
      .where(eq(employeeOnboardingProfile.id, id));

    if (!profile) {
      throw new AppError("Onboarding profile not found.", 404);
    }

    const [insertResult] = await tx.insert(employees).values({
      name: profile.name,
      gender: profile.gender,
      dob: profile.dob,
      email: profile.email,
      phone: profile.phone,
      address: profile.current_address,
      emergency_contact: profile.emergency_contact,
      github_url: profile.github_url,
      role: profile.role,
      tech_stack: profile.tech_stack,
      status: "onboarding", // employee starts in onboarding status, not active
    });

    const newEmployeeId = insertResult.insertId;

    await tx
      .delete(employeeOnboardingProfile)
      .where(eq(employeeOnboardingProfile.id, id));

    return newEmployeeId;
  });
}

export async function deleteOnboardProfile(id: number) {
  // Fetch file paths before deleting the row — once it's gone, we lose them.
  const [profile] = await db
    .select({
      nda_path: employeeOnboardingProfile.nda_path,
      citizenship_front_path: employeeOnboardingProfile.citizenship_front_path,
      citizenship_back_path: employeeOnboardingProfile.citizenship_back_path,
      pan_path: employeeOnboardingProfile.pan_path,
      passout_certificate_path:
        employeeOnboardingProfile.passout_certificate_path,
      photo_path: employeeOnboardingProfile.photo_path,
    })
    .from(employeeOnboardingProfile)
    .where(eq(employeeOnboardingProfile.id, id));

  if (!profile) {
    throw new AppError("Onboarding profile not found.", 404);
  }

  let result;
  try {
    [result] = await db
      .delete(employeeOnboardingProfile)
      .where(eq(employeeOnboardingProfile.id, id));
  } catch (err) {
    throw new AppError(
      err?.cause?.sqlMessage ?? "Failed to delete onboarding profile.",
      400,
    );
  }
  if (result.affectedRows === 0) {
    throw new AppError("Onboarding profile not found.", 404);
  }

  const FOLDER_MAP: Record<string, string> = {
    nda_path: "uploads/nda",
    citizenship_front_path: "uploads/profile/citizenship",
    citizenship_back_path: "uploads/profile/citizenship",
    pan_path: "uploads/profile/PAN",
    passout_certificate_path: "uploads/profile/certificate",
    photo_path: "uploads/profile/photo",
  };

  await Promise.all(
    Object.entries(FOLDER_MAP).map(async ([field, folder]) => {
      const filename = (profile as Record<string, string | null>)[field];
      if (!filename) return;
      try {
        await fs.unlink(path.join(folder, filename));
      } catch (unlinkErr) {
        console.error(`Failed to delete file ${field} (${filename}):`, unlinkErr);
      }
    }),
  );

  return { message: "Onboarding profile rejected and removed sucessfully." };
}
