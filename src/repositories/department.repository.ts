import { asc, eq } from "drizzle-orm";
import { db } from "../config/database";
import { departments, positions, employees, employeePositions } from "../../drizzle/schema";

// All active departments, sorted by name — includes the designated head
// position and whoever currently holds it, if anyone ("no head" shows as nulls).
export async function findAllActive() {
  return db
    .select({
      id: departments.id,
      name: departments.name,
      head_position_id: departments.headPositionId,
      head_position_title: positions.title,
      head_employee_id: employees.id,
      head_employee_name: employees.name,
    })
    .from(departments)
    .leftJoin(positions, eq(departments.headPositionId, positions.id))
    .leftJoin(employeePositions, eq(employeePositions.positionId, positions.id))
    .leftJoin(employees, eq(employees.id, employeePositions.employeeId))
    .where(eq(departments.isActive, true))
    .orderBy(asc(departments.name));
}

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function create(name: string) {
  const result = await db.insert(departments).values({ name, isActive: true, createdAt: new Date() });
  return insertedId(result);
}

export async function findByName(name: string) {
  const rows = await db.select().from(departments).where(eq(departments.name, name)).limit(1);
  return rows[0] || null;
}

export async function setHead(departmentId: number | string, headPositionId: number | null) {
  await db
    .update(departments)
    .set({ headPositionId })
    .where(eq(departments.id, Number(departmentId)));
}

export async function findById(departmentId: number | string) {
  const rows = await db.select().from(departments).where(eq(departments.id, Number(departmentId))).limit(1);
  return rows[0] || null;
}

// Whoever currently holds this department's designated head position, if set and filled.
export async function findHeadIncumbent(departmentId: number | string) {
  const rows = await db
    .select({ id: employees.id, name: employees.name, email: employees.email, role: employees.role })
    .from(departments)
    .innerJoin(positions, eq(departments.headPositionId, positions.id))
    .innerJoin(employeePositions, eq(employeePositions.positionId, positions.id))
    .innerJoin(employees, eq(employees.id, employeePositions.employeeId))
    .where(eq(departments.id, Number(departmentId)))
    .limit(1);
  return rows[0] || null;
}
