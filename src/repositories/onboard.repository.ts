import { eq,and } from "drizzle-orm";
import { db } from "../config/database";
import {
  employeeOnboardingProfile,
  employees,
  EducationInfoEntry,
  PreviousExperienceEntry,
} from "../../drizzle/schema";
import AppError from "../pkg/AppError";
import * as employeeRepo from "./employee.repository";

// Uploaded filenames from POST /onboard (undefined = not uploaded). The entry
// arrays are indexed like education_info / previous_experience_info.
/** Max files in other_document_paths (multer maxCount for "otherDocument"). */
export const MAX_OTHER_DOCUMENTS = 4;

export interface OnboardFilenames {
  passportPhoto?: string;
  idFront?: string;
  idBack?: string;
  panFront?: string;
  panBack?: string;
  additionalDocument?: string;
  contract?: string;
  otherDocuments: string[];
  educationCertificates: (string | undefined)[];
  experienceLetters: (string | undefined)[];
}

const employeeOnboardingProfileColumns = {
  id: employeeOnboardingProfile.id,
  name: employeeOnboardingProfile.name,
  dob: employeeOnboardingProfile.dob,
  gender: employeeOnboardingProfile.gender,
  nationality: employeeOnboardingProfile.nationality,
  email: employeeOnboardingProfile.email,
  phone: employeeOnboardingProfile.phone,
  current_address: employeeOnboardingProfile.currentAddress,
  permanent_address: employeeOnboardingProfile.permanentAddress,
  linkedin_url: employeeOnboardingProfile.linkedinUrl,
  github_url: employeeOnboardingProfile.githubUrl,
  portfolio_url: employeeOnboardingProfile.portfolioUrl,
  education_info: employeeOnboardingProfile.educationInfo,
  previous_experience_info: employeeOnboardingProfile.previousExperienceInfo,
  emergency_contact_name: employeeOnboardingProfile.emergencyContactName,
  emergency_contact_relation: employeeOnboardingProfile.emergencyContactRelation,
  emergency_contact_phone: employeeOnboardingProfile.emergencyContactPhone,
  emergency_contact_email: employeeOnboardingProfile.emergencyContactEmail,
  emergency_contact_address: employeeOnboardingProfile.emergencyContactAddress,
  photo_path: employeeOnboardingProfile.photoPath,
  id_front_path: employeeOnboardingProfile.idFrontPath,
  id_back_path: employeeOnboardingProfile.idBackPath,
  pan_front_path: employeeOnboardingProfile.panFrontPath,
  pan_back_path: employeeOnboardingProfile.panBackPath,
  additional_document_path: employeeOnboardingProfile.additionalDocumentPath,
  contract_path: employeeOnboardingProfile.contractPath,
  other_document_paths: employeeOnboardingProfile.otherDocumentPaths,
  confirmed: employeeOnboardingProfile.confirmed,
  is_active: employeeOnboardingProfile.isActive,
  role: employeeOnboardingProfile.role,
  source: employeeOnboardingProfile.source,
  source_application_id: employeeOnboardingProfile.sourceApplicationId,
};

/** Education entry as sent by the frontend; certificate comes from the upload. */
type EducationPayloadEntry = Partial<Omit<EducationInfoEntry, "certificate">>;
/** Experience entry as sent by the frontend; experience_letter comes from the upload. */
type ExperiencePayloadEntry = Partial<Omit<PreviousExperienceEntry, "experience_letter">>;

// Onboarding form body, as sent by the frontend (snake_case). File paths are
// never taken from the body — only from the uploaded files.
interface OnboardPayload {
  name: string;
  email: string;
  role: "intern" | "employee" | "admin";
  dob?: string | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  nationality?: string | null;
  phone?: string | null;
  current_address?: string | null;
  permanent_address?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  education_info?: EducationPayloadEntry[] | null;
  previous_experience_info?: ExperiencePayloadEntry[] | null;
  emergency_contact_name?: string | null;
  emergency_contact_relation?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_email?: string | null;
  emergency_contact_address?: string | null;
  is_active?: boolean;
  source?: string;
  source_application_id?: string | null;
}

const EMPLOYMENT_TYPES = ["part-time", "full-time"] as const;
const WORK_LOCATIONS = ["remote", "physical", "hybrid"] as const;

function asArray<T>(value: unknown, field: string): T[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) {
    throw new AppError(`${field} must be an array.`, 400);
  }
  return value as T[];
}

/** Rejects uploaded entry files whose index has no matching payload entry. */
function assertFileIndexes(
  files: (string | undefined)[],
  entryCount: number,
  field: string,
) {
  const orphan = files.findIndex((f, i) => f && i >= entryCount);
  if (orphan !== -1) {
    throw new AppError(`${field}_${orphan} has no matching entry.`, 400);
  }
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T | null {
  if (value == null || value === "") return null;
  if (!allowed.includes(value as T)) {
    throw new AppError(`${field} must be one of: ${allowed.join(", ")}.`, 400);
  }
  return value as T;
}

function toEducationInfo(
  raw: unknown,
  certificates: (string | undefined)[],
): EducationInfoEntry[] | null {
  const entries = asArray<EducationPayloadEntry>(raw, "education_info");
  assertFileIndexes(certificates, entries?.length ?? 0, "educationCertificate");
  if (!entries) return null;
  return entries.map((e, i) => ({
    education_level: e?.education_level ?? "",
    institution_name: e?.institution_name ?? "",
    field_of_study: e?.field_of_study ?? "",
    still_enrolled: !!e?.still_enrolled,
    graduation_date: e?.graduation_date || null,
    certificate: certificates[i] ?? null,
  }));
}

function toPreviousExperienceInfo(
  raw: unknown,
  letters: (string | undefined)[],
): PreviousExperienceEntry[] | null {
  const entries = asArray<ExperiencePayloadEntry>(raw, "previous_experience_info");
  assertFileIndexes(letters, entries?.length ?? 0, "experienceLetter");
  if (!entries) return null;
  return entries.map((e, i) => ({
    company: e?.company ?? "",
    role: e?.role ?? "",
    start_date: e?.start_date ?? "",
    end_date: e?.end_date || null,
    still_working: !!e?.still_working,
    // Optional when the form layout leaves them out, so null is stored even
    // though the schema type is non-null.
    employment_type: oneOf(
      e?.employment_type, EMPLOYMENT_TYPES, `previous_experience_info[${i}].employment_type`,
    ) as PreviousExperienceEntry["employment_type"],
    work_location: oneOf(
      e?.work_location, WORK_LOCATIONS, `previous_experience_info[${i}].work_location`,
    ) as PreviousExperienceEntry["work_location"],
    description: e?.description || null,
    experience_letter: letters[i] ?? null,
  }));
}

function toProfileRow(data: OnboardPayload, filenames: OnboardFilenames) {
  return {
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    nationality: data.nationality,
    email: data.email,
    phone: data.phone,
    currentAddress: data.current_address,
    permanentAddress: data.permanent_address,
    linkedinUrl: data.linkedin_url,
    githubUrl: data.github_url,
    portfolioUrl: data.portfolio_url,
    educationInfo: toEducationInfo(data.education_info, filenames.educationCertificates),
    previousExperienceInfo: toPreviousExperienceInfo(
      data.previous_experience_info,
      filenames.experienceLetters,
    ),
    emergencyContactName: data.emergency_contact_name,
    emergencyContactRelation: data.emergency_contact_relation,
    emergencyContactPhone: data.emergency_contact_phone,
    emergencyContactEmail: data.emergency_contact_email,
    emergencyContactAddress: data.emergency_contact_address,
    isActive: data.is_active,
    role: data.role,
    source: data.source,
    sourceApplicationId: data.source_application_id,
    // Files not uploaded stay undefined, so updating an existing draft
    // doesn't null them out.
    photoPath: filenames.passportPhoto,
    idFrontPath: filenames.idFront,
    idBackPath: filenames.idBack,
    panFrontPath: filenames.panFront,
    panBackPath: filenames.panBack,
    additionalDocumentPath: filenames.additionalDocument,
    contractPath: filenames.contract,
    otherDocumentPaths: filenames.otherDocuments.length
      ? filenames.otherDocuments.slice(0, MAX_OTHER_DOCUMENTS)
      : undefined,
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
  // Outside the try: payload validation errors are already AppErrors.
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
  role: "intern" | "employee";
  source: string;
  source_application_id: string;
}

/**
 * Seeds or refreshes a draft onboarding profile from an external source (the job-portal
 * candidate-hired webhook). Only fills fields that source actually has — gender, DOB,
 * address, emergency contact, education, experience and the document uploads are left
 * for the candidate/HR to complete in the onboarding form.
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
      // Not a form field to pre-fill — used by the frontend only to warn if the candidate
      // is filling out the wrong form (e.g. drafted as "employee" but on the intern page).
      role: employeeOnboardingProfile.role,
    })
    .from(employeeOnboardingProfile)
    .where(and(eq(employeeOnboardingProfile.email, email), eq(employeeOnboardingProfile.isActive, true)));

  return draft ?? null;
}

/**
 * employees still has a single emergency_contact column (varchar 150), so the
 * structured onboarding fields are folded into "Name (Relation) Phone".
 */
function formatEmergencyContact(profile: {
  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_phone: string | null;
}): string | null {
  const name = profile.emergency_contact_name?.trim();
  const relation = profile.emergency_contact_relation?.trim();
  const phone = profile.emergency_contact_phone?.trim();
  const text = [name, relation && `(${relation})`, phone].filter(Boolean).join(" ");
  return text ? text.slice(0, 150) : null;
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
      emergencyContact: formatEmergencyContact(profile),
      githubUrl: profile.github_url,
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

/** Raw filenames for every upload on a profile (doc columns + JSON entries). */
export async function getOnboardFiles(id: number) {
  const [row] = await db
    .select({
      photoPath: employeeOnboardingProfile.photoPath,
      idFrontPath: employeeOnboardingProfile.idFrontPath,
      idBackPath: employeeOnboardingProfile.idBackPath,
      panFrontPath: employeeOnboardingProfile.panFrontPath,
      panBackPath: employeeOnboardingProfile.panBackPath,
      additionalDocumentPath: employeeOnboardingProfile.additionalDocumentPath,
      contractPath: employeeOnboardingProfile.contractPath,
      otherDocumentPaths: employeeOnboardingProfile.otherDocumentPaths,
      educationInfo: employeeOnboardingProfile.educationInfo,
      previousExperienceInfo: employeeOnboardingProfile.previousExperienceInfo,
    })
    .from(employeeOnboardingProfile)
    .where(eq(employeeOnboardingProfile.id, id));
  return row ?? null;
}

/**
 * Soft delete (reject): marks the profile inactive instead of removing the row.
 * Uploaded files are kept so the profile can still be reviewed or restored.
 */
export async function deactivateOnboardProfile(id: number) {
  let result;
  try {
    [result] = await db
      .update(employeeOnboardingProfile)
      .set({ isActive: false })
      .where(
        and(
          eq(employeeOnboardingProfile.id, id),
          eq(employeeOnboardingProfile.isActive, true),
        ),
      );
  } catch (err) {
    throw new AppError(
      err?.cause?.sqlMessage ?? "Failed to reject onboarding profile.",
      400,
    );
  }
  if (result.affectedRows === 0) {
    throw new AppError("Onboarding profile not found or already inactive.", 404);
  }

  return { message: "Onboarding profile rejected successfully." };
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
