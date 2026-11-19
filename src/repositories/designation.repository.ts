import { asc, eq } from "drizzle-orm";
import { db } from "../config/database";
import { designations } from "../../drizzle/schema";

// All active designations, sorted by name.
export async function findAllActive() {
  return db
    .select({ id: designations.id, name: designations.title })
    .from(designations)
    .where(eq(designations.isActive, true))
    .orderBy(asc(designations.title));
}
