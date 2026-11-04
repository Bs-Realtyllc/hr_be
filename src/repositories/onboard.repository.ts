import { eq,and } from "drizzle-orm";
import { db } from "../config/database";
import { employeeOnboardingProfile, employees } from "../../drizzle/schema";
import AppError from "../pkg/AppError";
import fs from "fs/promises";
import path from "path";
import * as employeeRepo from "./employee.repository";

const employeeOnboardingProfileColumns = {
  id: employeeOnboardingProfile.id,
  name: employeeOnboardingProfile.name,
  gender: employeeOnboardingProfile.gender,
  dob: employeeOnboardingProfile.dob,
  email: employeeOnboardingProfile.email,
  phone: employeeOnboardingProfile.phone,
  current_address: employeeOnboardingProfile.currentAddress,
  permanent_address: employeeOnboardingProfile.permanentAddress,
  emergency_contact: employeeOnboardingProfile.emergencyContact,
  education_level: employeeOnboardingProfile.educationLevel,
  institution_name: employeeOnboardingProfile.institutionName,
  field_of_study: employeeOnboardingProfile.fieldOfStudy,
  graduation_date: employeeOnboardingProfile.graduationDate,
  previous_experience: employeeOnboardingProfile.previousExperience,
  is_active: employeeOnboardingProfile.isActive,
  areas_of_interest: employeeOnboardingProfile.areasOfInterest,
  linkedin_url: employeeOnboardingProfile.linkedinUrl,
  github_url: employeeOnboardingProfile.githubUrl,
  portfolio_url: employeeOnboardingProfile.portfolioUrl,
  role: employeeOnboardingProfile.role,
  additional_info: employeeOnboardingProfile.additionalInfo,
  tech_stack: employeeOnboardingProfile.techStack,
  nda_path: employeeOnboardingProfile.ndaPath,
  citizenship_front_path: employeeOnboardingProfile.citizenshipFrontPath,
  citizenship_back_path: employeeOnboardingProfile.citizenshipBackPath,
  pan_path: employeeOnboardingProfile.panPath,
  passout_certificate_path: employeeOnboardingProfile.passoutCertificatePath,
  photo_path: employeeOnboardingProfile.photoPath,
  designation: employeeOnboardingProfile.designation,
  source: employeeOnboardingProfile.source,
  source_application_id: employeeOnboardingProfile.sourceApplicationId,
};

interface OnboardFilenames {
  contract: string;
  citizenshipFront: string;
  citizenshipBack: string;
  panCard: string;
  passoutCertificate: string;
  passportPhoto: string;
}

// Onboarding form body, as sent by the frontend (snake_case).
interface OnboardPayload {
  name: string;
  email: string;
  role: "intern" | "employee" | "admin";
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  dob?: string | null;
  phone?: string | null;
  current_address?: string | null;
  permanent_address?: string | null;
  emergency_contact?: string | null;
  education_level?: string | null;
  institution_name?: string | null;
  field_of_study?: string | null;
  graduation_date?: string | null;
  previous_experience?: string | null;
  is_active?: boolean;
  areas_of_interest?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  additional_info?: string | null;
  tech_stack?: unknown;
  designation?: string | null;
  source?: string;
  source_application_id?: string | null;
}

function toProfileRow(data: OnboardPayload, filenames: OnboardFilenames) {
  return {
    name: data.name,
    gender: data.gender,
    dob: data.dob,
    email: data.email,
    phone: data.phone,
    currentAddress: data.current_address,
    permanentAddress: data.permanent_address,
    emergencyContact: data.emergency_contact,
    educationLevel: data.education_level,
    institutionName: data.institution_name,
    fieldOfStudy: data.field_of_study,
    graduationDate: data.graduation_date,
    previousExperience: data.previous_experience,
    isActive: data.is_active,
    areasOfInterest: data.areas_of_interest,
    linkedinUrl: data.linkedin_url,
    githubUrl: data.github_url,
    portfolioUrl: data.portfolio_url,
    role: data.role,
    additionalInfo: data.additional_info,
    techStack: data.tech_stack,
    designation: data.designation,
    source: data.source,
    sourceApplicationId: data.source_application_id,
    ndaPath: filenames.contract,
    citizenshipFrontPath: filenames.citizenshipFront,
    citizenshipBackPath: filenames.citizenshipBack,
    panPath: filenames.panCard,
    passoutCertificatePath: filenames.passoutCertificate,
    photoPath: filenames.passportPhoto,
  };
}

export async function getOnboardProfile(type: "intern" | "employee" | "all") {
  const result =
    type === "all"
      ? await db.select(employeeOnboardingProfileColumns).from(employeeOnboardingProfile)
      .where(eq(employeeOnboardingProfile.isActive, true)) // no filter → all rows must be active
      : await db
          .select(employeeOnboardingProfileColumns)
          .from(employeeOnboardingProfile)
          .where(and(eq(employeeOnboardingProfile.role, type), eq(employeeOnboardingProfile.isActive, true))); // filtered by role and active status

  return result;
}

export async function getOnboardProfileById(id: number) {
  const [profile] = await db
    .select(employeeOnboardingProfileColumns)
    .from(employeeOnboardingProfile)
    .where(eq(employeeOnboardingProfile.id, id)); // filtered by id

  return profile;
}

export async function saveOnboardProfile(
  data: OnboardPayload,
  filenames: OnboardFilenames,
) {
  const row = toProfileRow(data, filenames);

  try {
    // email is unique — if a job-portal webhook already seeded a draft for this address,
    // complete that same row instead of inserting a second one and hitting the unique key.
    const [existingDraft] = await db
      .select({ id: employeeOnboardingProfile.id })
      .from(employeeOnboardingProfile)
      .where(
        and(
          eq(employeeOnboardingProfile.email, data.email),
          eq(employeeOnboardingProfile.isActive, true),
        ),
      );

    if (existingDraft) {
      await db
        .update(employeeOnboardingProfile)
        .set(row)
        .where(eq(employeeOnboardingProfile.id, existingDraft.id));
      return;
    }

    await db.insert(employeeOnboardingProfile).values(row);
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
        linkedinUrl: data.linkedin_url ?? null,
        githubUrl: data.github_url ?? null,
        designation: data.designation ?? null,
        techStack: data.tech_stack ?? null,
        previousExperience: data.previous_experience ?? null,
        role: data.role,
        source: data.source,
        sourceApplicationId: data.source_application_id,
        isActive: true,
      })
      .where(eq(employeeOnboardingProfile.id, existingDraft.id));
    return existingDraft.id;
  }

  const [result] = await db.insert(employeeOnboardingProfile).values({
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    linkedinUrl: data.linkedin_url ?? null,
    githubUrl: data.github_url ?? null,
    designation: data.designation ?? null,
    techStack: data.tech_stack ?? null,
    previousExperience: data.previous_experience ?? null,
    role: data.role,
    source: data.source,
    sourceApplicationId: data.source_application_id,
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
      linkedin_url: employeeOnboardingProfile.linkedinUrl,
      github_url: employeeOnboardingProfile.githubUrl,
      previous_experience: employeeOnboardingProfile.previousExperience,
      // Not a form field to pre-fill — used by the frontend only to warn if the candidate
      // is filling out the wrong form (e.g. drafted as "employee" but on the intern page).
      role: employeeOnboardingProfile.role,
    })
    .from(employeeOnboardingProfile)
    .where(and(eq(employeeOnboardingProfile.email, email), eq(employeeOnboardingProfile.isActive, true)));

  return draft ?? null;
}

export async function approveOnboardProfile(id: number) {
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .select(employeeOnboardingProfileColumns)
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
      emergencyContact: profile.emergency_contact,
      githubUrl: profile.github_url,
      designation: profile.designation,
      role: profile.role,
      status: "onboarding",
      startDate: new Date().toISOString().split('T')[0]
    });

    // const newEmployeeId = insertResult.insertId;

    // await tx
      // .delete(employeeOnboardingProfile)
      // .where(eq(employeeOnboardingProfile.id, id));

      await tx.update(employeeOnboardingProfile).set({isActive : false}).where(eq(employeeOnboardingProfile.id, id))

    return profile;
  });
}

export async function deleteOnboardProfile(id: number) {
  // Fetch file paths before deleting the row — once it's gone, we lose them.
  const [profile] = await db
    .select({
      nda_path: employeeOnboardingProfile.ndaPath,
      citizenship_front_path: employeeOnboardingProfile.citizenshipFrontPath,
      citizenship_back_path: employeeOnboardingProfile.citizenshipBackPath,
      pan_path: employeeOnboardingProfile.panPath,
      passout_certificate_path:
        employeeOnboardingProfile.passoutCertificatePath,
      photo_path: employeeOnboardingProfile.photoPath,
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
