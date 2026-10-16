import { eq,and } from "drizzle-orm";
import { db } from "../config/database";
import { employeeOnboardingProfile, employees } from "../models";
import AppError from "../pkg/AppError";
import fs from "fs/promises";
import path from "path";
import * as employeeRepo from "./employee.repository";

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
      ? await db.select().from(employeeOnboardingProfile)
      .where(eq(employeeOnboardingProfile.is_active, true)) // no filter → all rows must be active
      : await db
          .select()
          .from(employeeOnboardingProfile)
          .where(and(eq(employeeOnboardingProfile.role, type), eq(employeeOnboardingProfile.is_active, true))); // filtered by role and active status

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
  const fileFields = {
    nda_path: filenames.contract,
    citizenship_front_path: filenames.citizenshipFront,
    citizenship_back_path: filenames.citizenshipBack,
    pan_path: filenames.panCard,
    passout_certificate_path: filenames.passoutCertificate,
    photo_path: filenames.passportPhoto,
  };

  try {
    // email is unique — if a job-portal webhook already seeded a draft for this address,
    // complete that same row instead of inserting a second one and hitting the unique key.
    const [existingDraft] = await db
      .select({ id: employeeOnboardingProfile.id })
      .from(employeeOnboardingProfile)
      .where(
        and(
          eq(employeeOnboardingProfile.email, data.email),
          eq(employeeOnboardingProfile.is_active, true),
        ),
      );

    if (existingDraft) {
      await db
        .update(employeeOnboardingProfile)
        .set({ ...data, ...fileFields })
        .where(eq(employeeOnboardingProfile.id, existingDraft.id));
      return;
    }

    await db.insert(employeeOnboardingProfile).values({
      ...data,
      ...fileFields,
    } as typeof employeeOnboardingProfile.$inferInsert);
  } catch (err) {
    throw new AppError(
      err?.cause?.sqlMessage ?? err.message ?? "Failed to save profile",
      400,
    );
  }
}
interface ExternalOnboardDraft {
  name: string;
  email: string;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  designation?: string | null;
  tech_stack?: string[] | null;
  previous_experience?: string | null;
  role: "intern" | "employee";
  source: string;
  source_application_id: string;
}

/**
 * Seeds or refreshes a draft onboarding profile from an external source (the job-portal
 * candidate-hired webhook). Only fills fields that source actually has — gender, DOB,
 * address, emergency contact, education, and the document uploads are left for the
 * candidate/HR to complete in the onboarding form.
 */
export async function upsertDraftFromExternalSource(data: ExternalOnboardDraft) {
  const existingEmployee = await employeeRepo.findByEmail(data.email);
  if (existingEmployee) {
    console.info(`[job-portal-sync] ${data.email} is already an employee — skipping draft`);
    return existingEmployee.id;
  }

  const [existingDraft] = await db
    .select({ id: employeeOnboardingProfile.id })
    .from(employeeOnboardingProfile)
    .where(eq(employeeOnboardingProfile.email, data.email));

  if (existingDraft) {
    await db
      .update(employeeOnboardingProfile)
      .set({
        name: data.name,
        phone: data.phone ?? null,
        linkedin_url: data.linkedin_url ?? null,
        github_url: data.github_url ?? null,
        designation: data.designation ?? null,
        tech_stack: data.tech_stack ?? null,
        previous_experience: data.previous_experience ?? null,
        role: data.role,
        source: data.source,
        source_application_id: data.source_application_id,
        is_active: true,
      })
      .where(eq(employeeOnboardingProfile.id, existingDraft.id));
    return existingDraft.id;
  }

  const [result] = await db.insert(employeeOnboardingProfile).values({
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    linkedin_url: data.linkedin_url ?? null,
    github_url: data.github_url ?? null,
    designation: data.designation ?? null,
    tech_stack: data.tech_stack ?? null,
    previous_experience: data.previous_experience ?? null,
    role: data.role,
    source: data.source,
    source_application_id: data.source_application_id,
  } as typeof employeeOnboardingProfile.$inferInsert);

  return (result as any).insertId;
}

/**
 * Fields a candidate's own browser is allowed to see before they've authenticated —
 * no id, no file paths, no source bookkeeping. Only returns a job-portal-seeded draft
 * that hasn't been approved/rejected yet (is_active = true).
 */
export async function getDraftByEmail(email: string) {
  const [draft] = await db
    .select({
      name: employeeOnboardingProfile.name,
      linkedin_url: employeeOnboardingProfile.linkedin_url,
      github_url: employeeOnboardingProfile.github_url,
      previous_experience: employeeOnboardingProfile.previous_experience,
      // Not a form field to pre-fill — used by the frontend only to warn if the candidate
      // is filling out the wrong form (e.g. drafted as "employee" but on the intern page).
      role: employeeOnboardingProfile.role,
    })
    .from(employeeOnboardingProfile)
    .where(and(eq(employeeOnboardingProfile.email, email), eq(employeeOnboardingProfile.is_active, true)));

  return draft ?? null;
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
      designation: profile.designation,
      role: profile.role,
      tech_stack: profile.tech_stack,
      status: "onboarding",
      start_date: new Date().toISOString().split('T')[0]
    });

    // const newEmployeeId = insertResult.insertId;

    // await tx
      // .delete(employeeOnboardingProfile)
      // .where(eq(employeeOnboardingProfile.id, id));

      await tx.update(employeeOnboardingProfile).set({is_active : false}).where(eq(employeeOnboardingProfile.id, id))

    return profile;
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
        console.error(
          `Failed to delete file ${field} (${filename}):`,
          unlinkErr,
        );
      }
    }),
  );

  return { message: "Onboarding profile rejected and removed sucessfully." };
}

export async function addAdmin (name, email, role,g){
  try{
    const [result] = await db.insert(employeeOnboardingProfile).values({
    name,
    email,
    role,
    gender: g
  });

  return result.insertId;
  }catch(err){
    console.log(err)
    if(err?.cause.code === 'ER_DUP_ENTRY') throw new AppError(`user with mail ${email} already exits`, 400);
    throw new AppError(
      err?.cause?.sqlMessage ?? err.message ?? "Failed to save profile",
      400,
    );
  }
 
}
