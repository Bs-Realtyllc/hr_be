import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/database";
import { employees, employeeOffboarding, employeeOffboardingTasks } from "../models";
import type { NewEmployeeOffboarding } from "../models/EmployeeOffboarding";
import AppError from "../pkg/AppError";

const CHECKLIST_TEMPLATE: Array<{ category: "hr" | "it" | "finance" | "manager"; title: string }> = [
  { category: "hr", title: "Conduct exit interview" },
  { category: "hr", title: "Generate relieving / experience letter" },
  { category: "it", title: "Revoke system access, email, and 2FA/trusted devices" },
  { category: "it", title: "Revoke Discord and Google Workspace access" },
  { category: "it", title: "Collect assigned devices and assets" },
  { category: "finance", title: "Process final settlement (salary, leave encashment, reimbursements)" },
  { category: "manager", title: "Complete knowledge transfer / handover" },
  { category: "manager", title: "Reassign ongoing projects and tasks" },
];

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function initiate(
  input: Omit<NewEmployeeOffboarding, "previous_status" | "status">,
  actorId: number | null,
) {
  return db.transaction(async (tx) => {
    const [employee] = await tx
      .select({ id: employees.id, status: employees.status })
      .from(employees)
      .where(eq(employees.id, input.emp_id));
    if (!employee) throw new AppError("Employee not found", 404);
    if (employee.status === "terminated") throw new AppError("Employee is already terminated", 400);
    if (employee.status === "offboarding") throw new AppError("Employee already has an offboarding in progress", 400);

    const result = await tx.insert(employeeOffboarding).values({
      ...input,
      previous_status: employee.status,
      created_by: actorId,
      updated_by: actorId,
    });
    const offboardingId = insertedId(result);

    await tx.insert(employeeOffboardingTasks).values(
      CHECKLIST_TEMPLATE.map((task) => ({
        offboarding_id: offboardingId,
        category: task.category,
        title: task.title,
        created_by: actorId,
        updated_by: actorId,
      })),
    );

    await tx.update(employees).set({ status: "offboarding" }).where(eq(employees.id, input.emp_id));

    return offboardingId;
  });
}

export async function findById(id: number) {
  const [row] = await db.select().from(employeeOffboarding).where(eq(employeeOffboarding.id, id));
  return row;
}

export async function listTasks(offboardingId: number) {
  return db
    .select()
    .from(employeeOffboardingTasks)
    .where(eq(employeeOffboardingTasks.offboarding_id, offboardingId));
}

export async function list(status?: string) {
  if (status) {
    return db.select().from(employeeOffboarding).where(eq(employeeOffboarding.status, status as any)).orderBy(desc(employeeOffboarding.created_at));
  }
  return db.select().from(employeeOffboarding).orderBy(desc(employeeOffboarding.created_at));
}

export async function listByEmployee(empId: number) {
  return db
    .select()
    .from(employeeOffboarding)
    .where(eq(employeeOffboarding.emp_id, empId))
    .orderBy(desc(employeeOffboarding.created_at));
}

export async function updateTask(
  offboardingId: number,
  taskId: number,
  updates: { status: "pending" | "completed" | "not_applicable"; notes?: string },
  actorId: number | null,
) {
  const [task] = await db
    .select()
    .from(employeeOffboardingTasks)
    .where(and(eq(employeeOffboardingTasks.id, taskId), eq(employeeOffboardingTasks.offboarding_id, offboardingId)));
  if (!task) throw new AppError("Offboarding task not found", 404);

  const isCompleting = updates.status !== "pending";
  await db
    .update(employeeOffboardingTasks)
    .set({
      status: updates.status,
      notes: updates.notes,
      completed_by: isCompleting ? actorId : null,
      completed_at: isCompleting ? new Date() : null,
      updated_by: actorId,
    })
    .where(eq(employeeOffboardingTasks.id, taskId));
}

export async function complete(
  offboardingId: number,
  relievingLetterPath: string | null,
  actorId: number | null,
) {
  return db.transaction(async (tx) => {
    const [offboarding] = await tx.select().from(employeeOffboarding).where(eq(employeeOffboarding.id, offboardingId));
    if (!offboarding) throw new AppError("Offboarding record not found", 404);
    if (offboarding.status !== "in_progress") throw new AppError(`Offboarding is already ${offboarding.status}`, 400);

    const tasks = await tx
      .select({ status: employeeOffboardingTasks.status })
      .from(employeeOffboardingTasks)
      .where(eq(employeeOffboardingTasks.offboarding_id, offboardingId));
    const incomplete = tasks.some((t) => t.status === "pending");
    if (incomplete) throw new AppError("All checklist tasks must be completed or marked not applicable first", 400);

    await tx
      .update(employeeOffboarding)
      .set({
        status: "completed",
        completed_at: new Date(),
        relieving_letter_path: relievingLetterPath ?? offboarding.relieving_letter_path,
        updated_by: actorId,
      })
      .where(eq(employeeOffboarding.id, offboardingId));

    // employees.termination_date/termination_reason were dropped by
    // migrate_zz_consolidate_employee_tables.sql — exit date/reason live on
    // employee_offboarding (last_working_day/reason) instead.
    await tx
      .update(employees)
      .set({ status: "terminated" })
      .where(eq(employees.id, offboarding.emp_id));

    return offboarding;
  });
}

export async function cancel(offboardingId: number, actorId: number | null) {
  return db.transaction(async (tx) => {
    const [offboarding] = await tx.select().from(employeeOffboarding).where(eq(employeeOffboarding.id, offboardingId));
    if (!offboarding) throw new AppError("Offboarding record not found", 404);
    if (offboarding.status !== "in_progress") throw new AppError(`Offboarding is already ${offboarding.status}`, 400);

    await tx
      .update(employeeOffboarding)
      .set({ status: "cancelled", cancelled_at: new Date(), updated_by: actorId })
      .where(eq(employeeOffboarding.id, offboardingId));

    await tx
      .update(employees)
      .set({ status: offboarding.previous_status as any })
      .where(eq(employees.id, offboarding.emp_id));

    return offboarding;
  });
}
