import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { formsLayout } from "../models";

export async function saveFormLayout(name: string, data: Record<string, any>) {
  // Merge at the top level so a partial save (e.g. just the contract
  // template) doesn't wipe out the rest of the stored layout, and vice versa.
  const existing = await getFormLayout(name);
  const merged = {
    ...(existing && typeof existing === "object" ? existing : {}),
    ...data,
  };

  await db
    .insert(formsLayout)
    .values({ name, data: merged })
    .onDuplicateKeyUpdate({ set: { data: merged } });
  return {
    success: true,
    message: "Form layout saved successfully",
  };
}

export async function getFormLayout(name: string) {
  const result = await db
    .select()
    .from(formsLayout)
    .where(eq(formsLayout.name, name))
    .limit(1);

  if (!result.length) {
    return null; // Return null if no matching layout is found
  }
  return result[0].data;
}
