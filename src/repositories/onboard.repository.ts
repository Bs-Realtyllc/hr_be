import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { employeeOnboardingProfile, employees } from "../models";
import AppError from "../pkg/AppError";

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

export async function saveOnboardProfile(data: Record<string, any>) {
  // const {name, dob,gender, email, current_address, permanent_address, education_level, institution_name, field_of_study, graduation_date, previous_experience, areas_of_intrest, linkedin_url, github_url, portfolio_url, role, additional_info, phone, emergency_conatct, tech_stack} = data;
  try {
    return await db
      .insert(employeeOnboardingProfile)
      .values(data as typeof employeeOnboardingProfile.$inferInsert);
  } catch (err) {
    throw new AppError(err.cause.sqlMessage, 400);
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

    await tx.insert(employees).values({
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

    await tx
      .delete(employeeOnboardingProfile)
      .where(eq(employeeOnboardingProfile.id, id));

    return profile;
  });
}

export async function deleteOnboardProfile(id: number) {
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

  return { message: "Onboarding profile rejected and removed sucessfully." };
}
