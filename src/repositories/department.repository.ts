import { asc, eq } from "drizzle-orm";
import { db } from "../config/database";
import { departments } from "../../drizzle/schema";

// All active departments, sorted by name.
export async function findAllActive() {
  return db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(eq(departments.isActive, true))
    .orderBy(asc(departments.name));
}
