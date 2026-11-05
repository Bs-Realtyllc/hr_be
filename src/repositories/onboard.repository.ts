import { eq,and } from "drizzle-orm";
import { db } from "../config/database";
import { employeeOnboardingProfile, employees } from "../../drizzle/schema";
import type { NewEmployeeOnboardingProfile } from "../../drizzle/schema";
import AppError from "../pkg/AppError";
import * as employeeRepo from "./employee.repository";
import type { OnboardFileField } from "../middleware/uplod";
import type { OnboardCreateInput, OnboardFilePaths } from "../dtos/onboard.dto";

const employeeOnboardingProfileColumns = {
  id: employeeOnboardingProfile.id,
  name: employeeOnboardingProfile.name,
  gender: employeeOnboardingProfile.gender,
  dob: employeeOnboardingProfile.dob,
  nationality: employeeOnboardingProfile.nationality,
  email: employeeOnboardingProfile.email,
  phone: employeeOnboardingProfile.phone,
  current_address: employeeOnboardingProfile.currentAddress,
  permanent_address: employeeOnboardingProfile.permanentAddress,
  designation: employeeOnboardingProfile.designation,
  department: employeeOnboardingProfile.department,
  start_date: employeeOnboardingProfile.startDate,
  reporting_manager: employeeOnboardingProfile.reportingManager,
  employment_type: employeeOnboardingProfile.employmentType,
  work_location: employeeOnboardingProfile.workLocation,
  emergency_contact_name: employeeOnboardingProfile.emergencyContactName,
  emergency_contact_relationship: employeeOnboardingProfile.emergencyContactRelationship,
  emergency_contact_phone: employeeOnboardingProfile.emergencyContactPhone,
  emergency_contact_email: employeeOnboardingProfile.emergencyContactEmail,
  emergency_contact_address: employeeOnboardingProfile.emergencyContactAddress,
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
  citizenship_front_path: employeeOnboardingProfile.citizenshipFrontPath,
  citizenship_back_path: employeeOnboardingProfile.citizenshipBackPath,
  pan_front_path: employeeOnboardingProfile.panFrontPath,
  pan_back_path: employeeOnboardingProfile.panBackPath,
  educational_document_path: employeeOnboardingProfile.educationalDocumentPath,
  additional_document_path: employeeOnboardingProfile.additionalDocumentPath,
  signed_contract_path: employeeOnboardingProfile.signedContractPath,
  offer_letter_path: employeeOnboardingProfile.offerLetterPath,
  other_employment_document_path: employeeOnboardingProfile.otherEmploymentDocumentPath,
  photo_path: employeeOnboardingProfile.photoPath,
  source: employeeOnboardingProfile.source,
  source_application_id: employeeOnboardingProfile.sourceApplicationId,
};

export type OnboardProfile = Awaited<ReturnType<typeof getOnboardProfileById>>;

// Form file field → the column storing that file's path.
const FILE_COLUMNS = {
  citizenshipFront: "citizenshipFrontPath",
  citizenshipBack: "citizenshipBackPath",
  panFront: "panFrontPath",
  panBack: "panBackPath",
  educational: "educationalDocumentPath",
  additional: "additionalDocumentPath",
  signedContract: "signedContractPath",
  offerLetter: "offerLetterPath",
  otherEmployment: "otherEmploymentDocumentPath",
} as const satisfies Record<OnboardFileField, keyof NewEmployeeOnboardingProfile>;

// Every column that holds an uploaded file path (including the legacy photo).
const allFilePathColumns = {
  citizenshipFrontPath: employeeOnboardingProfile.citizenshipFrontPath,
  citizenshipBackPath: employeeOnboardingProfile.citizenshipBackPath,
  panFrontPath: employeeOnboardingProfile.panFrontPath,
  panBackPath: employeeOnboardingProfile.panBackPath,
  educationalDocumentPath: employeeOnboardingProfile.educationalDocumentPath,
  additionalDocumentPath: employeeOnboardingProfile.additionalDocumentPath,
  signedContractPath: employeeOnboardingProfile.signedContractPath,
  offerLetterPath: employeeOnboardingProfile.offerLetterPath,
  otherEmploymentDocumentPath: employeeOnboardingProfile.otherEmploymentDocumentPath,
  photoPath: employeeOnboardingProfile.photoPath,
};

const nonEmptyPaths = (row: Record<string, string | null> | undefined) =>
  row ? Object.values(row).filter((p): p is string => !!p) : [];

function toProfileRow(input: OnboardCreateInput, filePaths: OnboardFilePaths) {
  const { personalInfo: p, employmentInfo: e, emergencyContact: c } = input;

  const fileColumns = Object.fromEntries(
    (Object.keys(FILE_COLUMNS) as OnboardFileField[]).map((field) => [
      FILE_COLUMNS[field],
      filePaths[field] ?? null,
    ]),
  ) as Record<(typeof FILE_COLUMNS)[OnboardFileField], string | null>;

  return {
    role: input.role,
    name: p.name,
    dob: p.dob,
    gender: p.gender,
    nationality: p.nationality,
    email: p.email,
    phone: p.phone,
    currentAddress: p.currentAddress,
    permanentAddress: p.permanentAddress,
    designation: e.jobTitle,
    department: e.department,
    startDate: e.startDate,
    reportingManager: e.reportingManager,
    employmentType: e.employmentType,
    workLocation: e.workLocation,
    emergencyContactName: c.fullName,
    emergencyContactRelationship: c.relationship,
    emergencyContactPhone: c.phone,
    emergencyContactEmail: c.email,
    emergencyContactAddress: c.address,
    isActive: true,
    ...fileColumns,
  } satisfies NewEmployeeOnboardingProfile;
}

// employees.emergency_contact is a single varchar(150), so flatten the structured contact into it
function formatEmergencyContact(profile: NonNullable<OnboardProfile>): string | null {
  const name = profile.emergency_contact_name;
  if (!name) return null;
  const relationship = profile.emergency_contact_relationship
    ? ` (${profile.emergency_contact_relationship})`
    : "";
  const phone = profile.emergency_contact_phone ? ` - ${profile.emergency_contact_phone}` : "";
  return `${name}${relationship}${phone}`.slice(0, 150);
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

/**
 * Inserts the submitted onboarding form, or completes the existing active row for the
 * same email (e.g. a job-portal draft). Returns the paths of any previously stored files
 * that this submission replaced, so the caller can delete them from disk.
 */
export async function saveOnboardProfile(
  input: OnboardCreateInput,
  filePaths: OnboardFilePaths,
): Promise<{ replacedFilePaths: string[] }> {
  const row = toProfileRow(input, filePaths);

  try {
    // email is unique — if a job-portal webhook already seeded a draft for this address,
    // complete that same row instead of inserting a second one and hitting the unique key.
    const [existing] = await db
      .select({ id: employeeOnboardingProfile.id, files: allFilePathColumns })
      .from(employeeOnboardingProfile)
      .where(
        and(
          eq(employeeOnboardingProfile.email, row.email),
          eq(employeeOnboardingProfile.isActive, true),
        ),
      );

    if (existing) {
      await db
        .update(employeeOnboardingProfile)
        .set(row)
        .where(eq(employeeOnboardingProfile.id, existing.id));

      // photo_path isn't part of the form, so the update leaves it in place
      const { photoPath, ...formFiles } = existing.files;
      const kept = new Set(Object.values(FILE_COLUMNS).map((col) => row[col]));
      const replacedFilePaths = nonEmptyPaths(formFiles).filter((p) => !kept.has(p));
      return { replacedFilePaths };
    }

    await db.insert(employeeOnboardingProfile).values(row);
    return { replacedFilePaths: [] };
  } catch (err) {
    if (err?.cause?.code === "ER_DUP_ENTRY") {
      throw new AppError(`An onboarding record for ${row.email} already exists.`, 409);
    }
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
      emergencyContact: formatEmergencyContact(profile),
      githubUrl: profile.github_url,
      designation: profile.designation,
      role: profile.role,
      status: "onboarding",
      startDate: profile.start_date ?? new Date().toISOString().split('T')[0]
    });

    // const newEmployeeId = insertResult.insertId;

    // await tx
      // .delete(employeeOnboardingProfile)
      // .where(eq(employeeOnboardingProfile.id, id));

      await tx.update(employeeOnboardingProfile).set({isActive : false}).where(eq(employeeOnboardingProfile.id, id))

    return profile;
  });
}

/** Deletes the row and returns the stored paths of its uploaded files for the caller to remove. */
export async function deleteOnboardProfile(id: number): Promise<{ filePaths: string[] }> {
  // Fetch file paths before deleting the row — once it's gone, we lose them.
  const [profile] = await db
    .select(allFilePathColumns)
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

  return { filePaths: nonEmptyPaths(profile) };
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
