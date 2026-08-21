import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { formsLayout } from "../models";

export async function saveFormLayout(name: string, data: Record<string, any>) {
  await db
    .insert(formsLayout)
    .values({ name, data })
    .onDuplicateKeyUpdate({ set: { data } });
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
