import { eq, and, desc, isNull, ne, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { overtimeRequests, overtimeRequestSessions, employees, positions, projects, employeeDailyClock } from '../../drizzle/schema';

const overtimeRequestsColumns = {
  id: overtimeRequests.id,
  employee_id: overtimeRequests.employeeId,
  project_id: overtimeRequests.projectId,
  request_type: overtimeRequests.requestType,
  work_date: overtimeRequests.workDate,
  hours: overtimeRequests.hours,
  reason: overtimeRequests.reason,
  status: overtimeRequests.status,
  reviewed_by: overtimeRequests.reviewedBy,
  reviewed_at: overtimeRequests.reviewedAt,
  approved_despite_mismatch: overtimeRequests.approvedDespiteMismatch,
  actual_hours: overtimeRequests.actualHours,
  reconciled_at: overtimeRequests.reconciledAt,
  reconciled_by: overtimeRequests.reconciledBy,
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
const reconciler = alias(employees, 'ot_reconciler');
const requesterPosition = alias(positions, 'ot_employee_pos');

export async function findWithNames({ employeeId, status }: { employeeId?: number | string; status?: string }) {
  const conditions = [];
  if (employeeId) conditions.push(eq(overtimeRequests.employeeId, Number(employeeId)));
  if (status) conditions.push(eq(overtimeRequests.status, status as any));

  return db
    .select({
      ...overtimeRequestsColumns,
      employee_name: requester.name,
      designation: requesterPosition.title,
      project_name: projects.name,
      reviewer_name: reviewer.name,
      reconciler_name: reconciler.name,
    })
    .from(overtimeRequests)
    .innerJoin(requester, eq(overtimeRequests.employeeId, requester.id))
    .leftJoin(requesterPosition as any, eq(requester.positionId, requesterPosition.id))
    .leftJoin(projects, eq(overtimeRequests.projectId, projects.id))
    .leftJoin(reviewer, eq(overtimeRequests.reviewedBy, reviewer.id))
    .leftJoin(reconciler, eq(overtimeRequests.reconciledBy, reconciler.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(overtimeRequests.createdAt));
}

// Atomic: the header row and its session links are created together, so a
// 'worked' request can never end up with zero linked sessions because the
// second insert failed partway through.
export async function create(
  { employee_id, project_id, request_type, work_date, hours, reason }: any,
  clockIds: number[] = [],
) {
  return db.transaction(async (tx) => {
    const result = await tx.insert(overtimeRequests).values({
      employeeId: employee_id,
      projectId: project_id,
      requestType: request_type,
      workDate: work_date,
      hours: String(hours),
      reason,
      createdAt: new Date(),
    } as any);
    const id = insertedId(result);

    if (clockIds.length > 0) {
      await tx.insert(overtimeRequestSessions).values(
        clockIds.map((clockId) => ({ overtimeRequestId: id, clockId })),
      );
    }

    return id;
  });
}

// Guards against the same clock session being claimed by more than one
// overtime request at once — a rejected claim frees the session back up.
// Returns whichever of the given clockIds are already claimed, if any.
export async function findActiveClockIds(clockIds: number[]): Promise<number[]> {
  if (clockIds.length === 0) return [];
  const rows = await db
    .select({ clockId: overtimeRequestSessions.clockId })
    .from(overtimeRequestSessions)
    .innerJoin(overtimeRequests, eq(overtimeRequestSessions.overtimeRequestId, overtimeRequests.id))
    .where(and(inArray(overtimeRequestSessions.clockId, clockIds), ne(overtimeRequests.status, 'rejected')));
  return rows.map((r) => r.clockId);
}

export interface SessionDetail {
  clock_id: number;
  clock_date: string;
  clock_in: Date;
  clock_out: Date | null;
  clock_out_estimated: boolean;
}

// The exact clock sessions each of these requests was built from — batched
// across every row on the current page/list rather than one query per row,
// so the UI can show reviewers precisely which shift(s) a claim covers
// instead of just a count.
export async function findSessionsForRequests(requestIds: number[]): Promise<Map<number, SessionDetail[]>> {
  const byRequest = new Map<number, SessionDetail[]>();
  if (requestIds.length === 0) return byRequest;
  const rows = await db
    .select({
      overtimeRequestId: overtimeRequestSessions.overtimeRequestId,
      clockId: employeeDailyClock.id,
      clockDate: employeeDailyClock.clockDate,
      clockIn: employeeDailyClock.clockIn,
      clockOut: employeeDailyClock.clockOut,
      clockOutEstimated: employeeDailyClock.clockOutEstimated,
    })
    .from(overtimeRequestSessions)
    .innerJoin(employeeDailyClock, eq(overtimeRequestSessions.clockId, employeeDailyClock.id))
    .where(inArray(overtimeRequestSessions.overtimeRequestId, requestIds))
    .orderBy(employeeDailyClock.clockIn);
  for (const r of rows) {
    const list = byRequest.get(r.overtimeRequestId) ?? [];
    list.push({
      clock_id: r.clockId,
      clock_date: r.clockDate as string,
      clock_in: r.clockIn as Date,
      clock_out: r.clockOut as Date | null,
      clock_out_estimated: Boolean(r.clockOutEstimated),
    });
    byRequest.set(r.overtimeRequestId, list);
  }
  return byRequest;
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

// Every write below is conditioned on the row still being in the state the
// service layer just checked — two near-simultaneous calls on the same
// request (two reviewers, a double-click) would otherwise both pass that
// JS-side check and both proceed; for approve/reconcile that means a
// duplicate payroll adjustment, an actual double-payment, not just a UI
// glitch. Returning affectedRows lets the service layer tell "I won the
// race" from "someone already acted on this."

export async function approve(
  id: number | string,
  reviewerId: number,
  { hourlyRate, overtimeRate, amount, approvedDespiteMismatch }: { hourlyRate: number; overtimeRate: number; amount: number; approvedDespiteMismatch: boolean }
): Promise<boolean> {
  const result = await db
    .update(overtimeRequests)
    .set({
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      hourlyRate: String(hourlyRate),
      overtimeRate: String(overtimeRate),
      amount: String(amount),
      approvedDespiteMismatch,
      updatedBy: reviewerId,
    })
    .where(and(eq(overtimeRequests.id, Number(id)), eq(overtimeRequests.status, 'pending')));
  return result[0].affectedRows > 0;
}

// 'planned' requests skip the amount/hourly-rate fields on approval — those
// only get set once reconcile() below determines what was actually worked.
export async function approvePlanned(id: number | string, reviewerId: number): Promise<boolean> {
  const result = await db
    .update(overtimeRequests)
    .set({ status: 'approved', reviewedBy: reviewerId, reviewedAt: new Date(), updatedBy: reviewerId })
    .where(and(eq(overtimeRequests.id, Number(id)), eq(overtimeRequests.status, 'pending')));
  return result[0].affectedRows > 0;
}

export async function reject(id: number | string, reviewerId: number): Promise<boolean> {
  const result = await db
    .update(overtimeRequests)
    .set({ status: 'rejected', reviewedBy: reviewerId, reviewedAt: new Date(), updatedBy: reviewerId })
    .where(and(eq(overtimeRequests.id, Number(id)), eq(overtimeRequests.status, 'pending')));
  return result[0].affectedRows > 0;
}

export async function reconcile(
  id: number | string,
  reconcilerId: number,
  { actualHours, hourlyRate, overtimeRate, amount }: { actualHours: number; hourlyRate: number; overtimeRate: number; amount: number }
): Promise<boolean> {
  const result = await db
    .update(overtimeRequests)
    .set({
      actualHours: String(actualHours),
      hourlyRate: String(hourlyRate),
      overtimeRate: String(overtimeRate),
      amount: String(amount),
      reconciledAt: new Date(),
      reconciledBy: reconcilerId,
      updatedBy: reconcilerId,
    })
    .where(and(
      eq(overtimeRequests.id, Number(id)),
      eq(overtimeRequests.status, 'approved'),
      isNull(overtimeRequests.reconciledAt),
    ));
  return result[0].affectedRows > 0;
}

// Only 'planned' requests are ever edited this way — a 'worked' request's
// date/hours are always derived from its linked sessions, never free-typed.
export async function update(
  id: number | string,
  { project_id, work_date, hours, reason }: any,
  actorId: number | null = null
) {
  await db
    .update(overtimeRequests)
    .set({ projectId: project_id, workDate: work_date, hours: String(hours), reason, updatedBy: actorId })
    .where(eq(overtimeRequests.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(overtimeRequests).where(eq(overtimeRequests.id, Number(id)));
}
