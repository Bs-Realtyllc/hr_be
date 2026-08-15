import { eq, and, desc, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { overtimeRequests, employeesFlat, projects } from '../models';

// Same exported function names/signatures as the old src/models/OvertimeRequest.js.

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const requester = alias(employeesFlat, 'ot_employee');
const reviewer = alias(employeesFlat, 'ot_reviewer');

export async function findWithNames({ employeeId, status }: { employeeId?: number | string; status?: string }) {
  const conditions = [];
  if (employeeId) conditions.push(eq(overtimeRequests.employee_id, Number(employeeId)));
  if (status) conditions.push(eq(overtimeRequests.status, status as any));

  return db
    .select({
      ...getTableColumns(overtimeRequests),
      employee_name: requester.name,
      designation: requester.designation,
      project_name: projects.name,
      reviewer_name: reviewer.name,
    })
    .from(overtimeRequests)
    .innerJoin(requester, eq(overtimeRequests.employee_id, requester.id))
    .leftJoin(projects, eq(overtimeRequests.project_id, projects.id))
    .leftJoin(reviewer, eq(overtimeRequests.reviewed_by, reviewer.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(overtimeRequests.created_at));
}

export async function create({ employee_id, project_id, work_date, hours, reason, approved_by_name }: any) {
  const result = await db.insert(overtimeRequests).values({
    employee_id,
    project_id,
    work_date,
    hours: String(hours),
    reason,
    approved_by_name,
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function findWithEmployeeById(id: number | string) {
  const rows = await db
    .select({
      ...getTableColumns(overtimeRequests),
      employee_name: requester.name,
      project_name: projects.name,
    })
    .from(overtimeRequests)
    .innerJoin(requester, eq(overtimeRequests.employee_id, requester.id))
    .leftJoin(projects, eq(overtimeRequests.project_id, projects.id))
    .where(eq(overtimeRequests.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function approve(
  id: number | string,
  reviewerId: number,
  { hourlyRate, overtimeRate, amount }: { hourlyRate: number; overtimeRate: number; amount: number }
) {
  await db
    .update(overtimeRequests)
    .set({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      hourly_rate: String(hourlyRate),
      overtime_rate: String(overtimeRate),
      amount: String(amount),
      updated_by: reviewerId,
    })
    .where(eq(overtimeRequests.id, Number(id)));
}

export async function reject(id: number | string, reviewerId: number) {
  await db
    .update(overtimeRequests)
    .set({ status: 'rejected', reviewed_by: reviewerId, reviewed_at: new Date(), updated_by: reviewerId })
    .where(eq(overtimeRequests.id, Number(id)));
}

export async function update(
  id: number | string,
  { project_id, work_date, hours, reason, approved_by_name }: any,
  actorId: number | null = null
) {
  await db
    .update(overtimeRequests)
    .set({ project_id, work_date, hours: String(hours), reason, approved_by_name, updated_by: actorId })
    .where(eq(overtimeRequests.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(overtimeRequests).where(eq(overtimeRequests.id, Number(id)));
}
