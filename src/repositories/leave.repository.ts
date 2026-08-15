import { eq, and, sql, desc, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { leaveRequests, leaveBalances, employeesFlat } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const requester = alias(employeesFlat, 'lr_employee');
const reviewer = alias(employeesFlat, 'lr_reviewer');

export async function findAllLeaveRequests() {
  return db.select().from(leaveRequests);
}

export async function findWithNames({ employeeId, status }: { employeeId?: number | string; status?: string }) {
  const conditions = [];
  if (employeeId) conditions.push(eq(leaveRequests.employee_id, Number(employeeId)));
  if (status) conditions.push(eq(leaveRequests.status, status as any));

  return db
    .select({
      ...getTableColumns(leaveRequests),
      employee_name: requester.name,
      designation: requester.designation,
      reviewer_name: reviewer.name,
    })
    .from(leaveRequests)
    .innerJoin(requester, eq(leaveRequests.employee_id, requester.id))
    .leftJoin(reviewer, eq(leaveRequests.reviewed_by, reviewer.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leaveRequests.created_at));
}

export async function findBalances(employeeId: number | string, year: number) {
  const rows = await db
    .select()
    .from(leaveBalances)
    .where(and(eq(leaveBalances.employee_id, Number(employeeId)), eq(leaveBalances.year, year)));
  return rows.map((r) => ({ ...r, remaining: (r.total ?? 0) - (r.taken ?? 0) }));
}

export async function findBalanceForType(employeeId: number | string, leaveType: string, year: number) {
  const rows = await db
    .select()
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.employee_id, Number(employeeId)),
        eq(leaveBalances.leave_type, leaveType as any),
        eq(leaveBalances.year, year)
      )
    )
    .limit(1);
  const row = rows[0];
  return row ? { ...row, remaining: (row.total ?? 0) - (row.taken ?? 0) } : null;
}

export async function findBalanceTotalsForYear(year: number) {
  const result: any = await db.execute(sql`
    SELECT e.id AS employee_id, e.name AS employee_name,
           COALESCE(SUM(lb.total), 0) AS total_leaves,
           COALESCE(SUM(lb.taken), 0) AS total_taken
    FROM employees_flat e
    LEFT JOIN leave_balances lb ON lb.employee_id = e.id AND lb.year = ${year}
    WHERE e.is_active = TRUE
    GROUP BY e.id, e.name
    ORDER BY e.name
  `);
  return result[0] as any[];
}

export async function findApprovedRangesForAllInRange(rangeStart: string, rangeEnd: string) {
  return db
    .select({ employee_id: leaveRequests.employee_id, start_date: leaveRequests.start_date, end_date: leaveRequests.end_date })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.status, 'approved'),
        sql`${leaveRequests.start_date} <= ${rangeEnd}`,
        sql`${leaveRequests.end_date} >= ${rangeStart}`
      )
    );
}

export async function findOutToday(today: string) {
  return db
    .select({
      name: requester.name,
      designation: requester.designation,
      profile_picture: requester.profile_picture,
      leave_type: leaveRequests.leave_type,
      end_date: leaveRequests.end_date,
    })
    .from(leaveRequests)
    .innerJoin(requester, eq(leaveRequests.employee_id, requester.id))
    .where(and(eq(leaveRequests.status, 'approved'), sql`${today} BETWEEN ${leaveRequests.start_date} AND ${leaveRequests.end_date}`));
}

export async function findOutInRange(rangeStart: string, rangeEnd: string) {
  return db
    .select({
      name: requester.name,
      designation: requester.designation,
      leave_type: leaveRequests.leave_type,
      start_date: leaveRequests.start_date,
      end_date: leaveRequests.end_date,
    })
    .from(leaveRequests)
    .innerJoin(requester, eq(leaveRequests.employee_id, requester.id))
    .where(
      and(
        eq(leaveRequests.status, 'approved'),
        sql`${leaveRequests.start_date} <= ${rangeEnd}`,
        sql`${leaveRequests.end_date} >= ${rangeStart}`
      )
    );
}

export async function create(
  { employee_id, leave_type, start_date, end_date, reason }: any,
  actorId: number | null = null
) {
  const result = await db.insert(leaveRequests).values({
    employee_id,
    leave_type,
    start_date,
    end_date,
    reason,
    created_by: actorId,
    updated_by: actorId,
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select().from(leaveRequests).where(eq(leaveRequests.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function findWithEmployeeById(id: number | string) {
  const rows = await db
    .select({
      ...getTableColumns(leaveRequests),
      employee_name: requester.name,
      designation: requester.designation,
      department: requester.department,
    })
    .from(leaveRequests)
    .innerJoin(requester, eq(leaveRequests.employee_id, requester.id))
    .where(eq(leaveRequests.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function approve(id: number | string, reviewerId: number) {
  await db
    .update(leaveRequests)
    .set({ status: 'approved', reviewed_by: reviewerId, reviewed_at: new Date(), updated_by: reviewerId })
    .where(eq(leaveRequests.id, Number(id)));
}

export async function approveExternally(id: number | string) {
  await db.update(leaveRequests).set({ status: 'approved', reviewed_at: new Date() }).where(eq(leaveRequests.id, Number(id)));
}

export async function findApprovedForEmployeeInRange(employeeId: number | string, startDate: string, endDate: string) {
  const rows = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employee_id, Number(employeeId)),
        eq(leaveRequests.status, 'approved'),
        eq(leaveRequests.start_date, startDate),
        eq(leaveRequests.end_date, endDate)
      )
    )
    .limit(1);
  return rows[0] || null;
}

export async function reject(id: number | string, reviewerId: number) {
  await db
    .update(leaveRequests)
    .set({ status: 'rejected', reviewed_by: reviewerId, reviewed_at: new Date(), updated_by: reviewerId })
    .where(eq(leaveRequests.id, Number(id)));
}

export async function incrementBalanceTaken(employeeId: number | string, leaveType: string, year: number, days: number) {
  await db
    .update(leaveBalances)
    .set({ taken: sql`${leaveBalances.taken} + ${days}` })
    .where(
      and(
        eq(leaveBalances.employee_id, Number(employeeId)),
        eq(leaveBalances.leave_type, leaveType as any),
        eq(leaveBalances.year, year)
      )
    );
}

export async function update(
  id: number | string,
  { leave_type, start_date, end_date, reason }: any,
  actorId: number | null = null
) {
  await db
    .update(leaveRequests)
    .set({ leave_type, start_date, end_date, reason, updated_by: actorId })
    .where(eq(leaveRequests.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(leaveRequests).where(eq(leaveRequests.id, Number(id)));
}
