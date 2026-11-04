import { eq, and, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { overtimeRequests, employees, designations, projects } from '../../drizzle/schema';

const overtimeRequestsColumns = {
  id: overtimeRequests.id,
  employee_id: overtimeRequests.employeeId,
  project_id: overtimeRequests.projectId,
  work_date: overtimeRequests.workDate,
  hours: overtimeRequests.hours,
  reason: overtimeRequests.reason,
  approved_by_name: overtimeRequests.approvedByName,
  status: overtimeRequests.status,
  reviewed_by: overtimeRequests.reviewedBy,
  reviewed_at: overtimeRequests.reviewedAt,
  hourly_rate: overtimeRequests.hourlyRate,
  overtime_rate: overtimeRequests.overtimeRate,
  amount: overtimeRequests.amount,
  created_at: overtimeRequests.createdAt,
  updated_at: overtimeRequests.updatedAt,
  created_by: overtimeRequests.createdBy,
  updated_by: overtimeRequests.updatedBy,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const requester = alias(employees, 'ot_employee');
const reviewer = alias(employees, 'ot_reviewer');
const requesterDesignation = alias(designations, 'ot_employee_desig');

export async function findWithNames({ employeeId, status }: { employeeId?: number | string; status?: string }) {
  const conditions = [];
  if (employeeId) conditions.push(eq(overtimeRequests.employeeId, Number(employeeId)));
  if (status) conditions.push(eq(overtimeRequests.status, status as any));

  return db
    .select({
      ...overtimeRequestsColumns,
      employee_name: requester.name,
      designation: requesterDesignation.title,
      project_name: projects.name,
      reviewer_name: reviewer.name,
    })
    .from(overtimeRequests)
    .innerJoin(requester, eq(overtimeRequests.employeeId, requester.id))
    .leftJoin(requesterDesignation, eq(requester.designationId, requesterDesignation.id))
    .leftJoin(projects, eq(overtimeRequests.projectId, projects.id))
    .leftJoin(reviewer, eq(overtimeRequests.reviewedBy, reviewer.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(overtimeRequests.createdAt));
}

export async function create({ employee_id, project_id, work_date, hours, reason, approved_by_name }: any) {
  const result = await db.insert(overtimeRequests).values({
    employeeId: employee_id,
    projectId: project_id,
    workDate: work_date,
    hours: String(hours),
    reason,
    approvedByName: approved_by_name,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select(overtimeRequestsColumns).from(overtimeRequests).where(eq(overtimeRequests.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function findWithEmployeeById(id: number | string) {
  const rows = await db
    .select({
      ...overtimeRequestsColumns,
      employee_name: requester.name,
      project_name: projects.name,
    })
    .from(overtimeRequests)
    .innerJoin(requester, eq(overtimeRequests.employeeId, requester.id))
    .leftJoin(projects, eq(overtimeRequests.projectId, projects.id))
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
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      hourlyRate: String(hourlyRate),
      overtimeRate: String(overtimeRate),
      amount: String(amount),
      updatedBy: reviewerId,
    })
    .where(eq(overtimeRequests.id, Number(id)));
}

export async function reject(id: number | string, reviewerId: number) {
  await db
    .update(overtimeRequests)
    .set({ status: 'rejected', reviewedBy: reviewerId, reviewedAt: new Date(), updatedBy: reviewerId })
    .where(eq(overtimeRequests.id, Number(id)));
}

export async function update(
  id: number | string,
  { project_id, work_date, hours, reason, approved_by_name }: any,
  actorId: number | null = null
) {
  await db
    .update(overtimeRequests)
    .set({ projectId: project_id, workDate: work_date, hours: String(hours), reason, approvedByName: approved_by_name, updatedBy: actorId })
    .where(eq(overtimeRequests.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(overtimeRequests).where(eq(overtimeRequests.id, Number(id)));
}
