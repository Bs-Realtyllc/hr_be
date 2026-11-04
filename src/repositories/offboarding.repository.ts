import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/database";
import { employees, employeeOffboarding, employeeOffboardingTasks } from "../../drizzle/schema";
import AppError from "../pkg/AppError";

const employeeOffboardingColumns = {
  id: employeeOffboarding.id,
  emp_id: employeeOffboarding.empId,
  exit_type: employeeOffboarding.exitType,
  reason: employeeOffboarding.reason,
  notice_date: employeeOffboarding.noticeDate,
  last_working_day: employeeOffboarding.lastWorkingDay,
  status: employeeOffboarding.status,
  previous_status: employeeOffboarding.previousStatus,
  relieving_letter_path: employeeOffboarding.relievingLetterPath,
  completed_at: employeeOffboarding.completedAt,
  cancelled_at: employeeOffboarding.cancelledAt,
  created_at: employeeOffboarding.createdAt,
  updated_at: employeeOffboarding.updatedAt,
  created_by: employeeOffboarding.createdBy,
  updated_by: employeeOffboarding.updatedBy,
};
const employeeOffboardingTasksColumns = {
  id: employeeOffboardingTasks.id,
  offboarding_id: employeeOffboardingTasks.offboardingId,
  category: employeeOffboardingTasks.category,
  title: employeeOffboardingTasks.title,
  status: employeeOffboardingTasks.status,
  notes: employeeOffboardingTasks.notes,
  completed_by: employeeOffboardingTasks.completedBy,
  completed_at: employeeOffboardingTasks.completedAt,
  created_at: employeeOffboardingTasks.createdAt,
  updated_at: employeeOffboardingTasks.updatedAt,
  created_by: employeeOffboardingTasks.createdBy,
  updated_by: employeeOffboardingTasks.updatedBy,
};

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

interface InitiateOffboardingInput {
  emp_id: number;
  exit_type: "resignation" | "termination" | "end_of_contract" | "non_renewal";
  reason?: string | null;
  notice_date: string;
  last_working_day: string;
}

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function initiate(
  input: InitiateOffboardingInput,
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
      empId: input.emp_id,
      exitType: input.exit_type,
      reason: input.reason,
      noticeDate: input.notice_date,
      lastWorkingDay: input.last_working_day,
      previousStatus: employee.status,
      createdBy: actorId,
      updatedBy: actorId,
    });
    const offboardingId = insertedId(result);

    await tx.insert(employeeOffboardingTasks).values(
      CHECKLIST_TEMPLATE.map((task) => ({
        offboardingId,
        category: task.category,
        title: task.title,
        createdBy: actorId,
        updatedBy: actorId,
      })),
    );

    await tx.update(employees).set({ status: "offboarding" }).where(eq(employees.id, input.emp_id));

    return offboardingId;
  });
}

export async function findById(id: number) {
  const [row] = await db.select(employeeOffboardingColumns).from(employeeOffboarding).where(eq(employeeOffboarding.id, id));
  return row;
}

export async function listTasks(offboardingId: number) {
  return db
    .select(employeeOffboardingTasksColumns)
    .from(employeeOffboardingTasks)
    .where(eq(employeeOffboardingTasks.offboardingId, offboardingId));
}

export async function list(status?: string) {
  return db
    .select(employeeOffboardingColumns)
    .from(employeeOffboarding)
    .where(status ? eq(employeeOffboarding.status, status as any) : undefined)
    .orderBy(desc(employeeOffboarding.createdAt));
}

export async function listByEmployee(empId: number) {
  return db
    .select(employeeOffboardingColumns)
    .from(employeeOffboarding)
    .where(eq(employeeOffboarding.empId, empId))
    .orderBy(desc(employeeOffboarding.createdAt));
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
    .where(and(eq(employeeOffboardingTasks.id, taskId), eq(employeeOffboardingTasks.offboardingId, offboardingId)));
  if (!task) throw new AppError("Offboarding task not found", 404);

  const isCompleting = updates.status !== "pending";
  await db
    .update(employeeOffboardingTasks)
    .set({
      status: updates.status,
      notes: updates.notes,
      completedBy: isCompleting ? actorId : null,
      completedAt: isCompleting ? new Date() : null,
      updatedBy: actorId,
    })
    .where(eq(employeeOffboardingTasks.id, taskId));
}

export async function complete(
  offboardingId: number,
  relievingLetterPath: string | null,
  actorId: number | null,
) {
  return db.transaction(async (tx) => {
    const [offboarding] = await tx.select(employeeOffboardingColumns).from(employeeOffboarding).where(eq(employeeOffboarding.id, offboardingId));
    if (!offboarding) throw new AppError("Offboarding record not found", 404);
    if (offboarding.status !== "in_progress") throw new AppError(`Offboarding is already ${offboarding.status}`, 400);

    const tasks = await tx
      .select({ status: employeeOffboardingTasks.status })
      .from(employeeOffboardingTasks)
      .where(eq(employeeOffboardingTasks.offboardingId, offboardingId));
    const incomplete = tasks.some((t) => t.status === "pending");
    if (incomplete) throw new AppError("All checklist tasks must be completed or marked not applicable first", 400);

    await tx
      .update(employeeOffboarding)
      .set({
        status: "completed",
        completedAt: new Date(),
        relievingLetterPath: relievingLetterPath ?? offboarding.relieving_letter_path,
        updatedBy: actorId,
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
    const [offboarding] = await tx.select(employeeOffboardingColumns).from(employeeOffboarding).where(eq(employeeOffboarding.id, offboardingId));
    if (!offboarding) throw new AppError("Offboarding record not found", 404);
    if (offboarding.status !== "in_progress") throw new AppError(`Offboarding is already ${offboarding.status}`, 400);

    await tx
      .update(employeeOffboarding)
      .set({ status: "cancelled", cancelledAt: new Date(), updatedBy: actorId })
      .where(eq(employeeOffboarding.id, offboardingId));

    await tx
      .update(employees)
      .set({ status: offboarding.previous_status as any })
      .where(eq(employees.id, offboarding.emp_id));

    return offboarding;
  });
}
