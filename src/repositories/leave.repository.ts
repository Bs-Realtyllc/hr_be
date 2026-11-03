import { eq, and, sql, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { leaveRequests, leaveBalances, employees, designations, departments, employeeDocuments } from '../../drizzle/schema';

const leaveBalancesColumns = {
  id: leaveBalances.id,
  employee_id: leaveBalances.employeeId,
  leave_type: leaveBalances.leaveType,
  total: leaveBalances.total,
  taken: leaveBalances.taken,
  year: leaveBalances.year,
};
const leaveRequestsColumns = {
  id: leaveRequests.id,
  employee_id: leaveRequests.employeeId,
  leave_type: leaveRequests.leaveType,
  start_date: leaveRequests.startDate,
  end_date: leaveRequests.endDate,
  reason: leaveRequests.reason,
  status: leaveRequests.status,
  reviewed_by: leaveRequests.reviewedBy,
  reviewed_at: leaveRequests.reviewedAt,
  created_at: leaveRequests.createdAt,
  updated_at: leaveRequests.updatedAt,
  created_by: leaveRequests.createdBy,
  updated_by: leaveRequests.updatedBy,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const requester = alias(employees, 'lr_employee');
const reviewer = alias(employees, 'lr_reviewer');
const requesterDesignation = alias(designations, 'lr_employee_desig');
const requesterDepartment = alias(departments, 'lr_employee_dept');
const requesterDoc = alias(employeeDocuments, 'lr_employee_doc');

export async function findAllLeaveRequests() {
  return db.select(leaveRequestsColumns).from(leaveRequests);
}

export async function findWithNames({ employeeId, status }: { employeeId?: number | string; status?: string }) {
  const conditions = [];
  if (employeeId) conditions.push(eq(leaveRequests.employeeId, Number(employeeId)));
  if (status) conditions.push(eq(leaveRequests.status, status as any));

  return db
    .select({
      ...leaveRequestsColumns,
      employee_name: requester.name,
      designation: requesterDesignation.title,
      reviewer_name: reviewer.name,
    })
    .from(leaveRequests)
    .innerJoin(requester, eq(leaveRequests.employeeId, requester.id))
    .leftJoin(requesterDesignation, eq(requester.designationId, requesterDesignation.id))
    .leftJoin(reviewer, eq(leaveRequests.reviewedBy, reviewer.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leaveRequests.createdAt));
}

export async function findBalances(employeeId: number | string, year: number) {
  const rows = await db
    .select(leaveBalancesColumns)
    .from(leaveBalances)
    .where(and(eq(leaveBalances.employeeId, Number(employeeId)), eq(leaveBalances.year, year)));
  return rows.map((r) => ({ ...r, remaining: (r.total ?? 0) - (r.taken ?? 0) }));
}

export async function findBalanceForType(employeeId: number | string, leaveType: string, year: number) {
  const rows = await db
    .select(leaveBalancesColumns)
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.employeeId, Number(employeeId)),
        eq(leaveBalances.leaveType, leaveType as any),
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
    FROM employees e
    LEFT JOIN leave_balances lb ON lb.employee_id = e.id AND lb.year = ${year}
    WHERE e.status NOT IN ('onboarding', 'terminated')
    GROUP BY e.id, e.name
    ORDER BY e.name
  `);
  return result[0] as any[];
}

export async function findApprovedRangesForAllInRange(rangeStart: string, rangeEnd: string) {
  return db
    .select({ employee_id: leaveRequests.employeeId, start_date: leaveRequests.startDate, end_date: leaveRequests.endDate })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.status, 'approved'),
        sql`${leaveRequests.startDate} <= ${rangeEnd}`,
        sql`${leaveRequests.endDate} >= ${rangeStart}`
      )
    );
}

export async function findOutToday(today: string) {
  return db
    .select({
      name: requester.name,
      designation: requesterDesignation.title,
      profile_picture: requesterDoc.filename,
      leave_type: leaveRequests.leaveType,
      end_date: leaveRequests.endDate,
    })
    .from(leaveRequests)
    .innerJoin(requester, eq(leaveRequests.employeeId, requester.id))
    .leftJoin(requesterDesignation, eq(requester.designationId, requesterDesignation.id))
    .leftJoin(requesterDoc, and(eq(requesterDoc.empId, requester.id), eq(requesterDoc.name, 'profile_picture')))
    .where(and(eq(leaveRequests.status, 'approved'), sql`${today} BETWEEN ${leaveRequests.startDate} AND ${leaveRequests.endDate}`));
}

export async function findOutInRange(rangeStart: string, rangeEnd: string) {
  return db
    .select({
      name: requester.name,
      designation: requesterDesignation.title,
      leave_type: leaveRequests.leaveType,
      start_date: leaveRequests.startDate,
      end_date: leaveRequests.endDate,
    })
    .from(leaveRequests)
    .innerJoin(requester, eq(leaveRequests.employeeId, requester.id))
    .leftJoin(requesterDesignation, eq(requester.designationId, requesterDesignation.id))
    .where(
      and(
        eq(leaveRequests.status, 'approved'),
        sql`${leaveRequests.startDate} <= ${rangeEnd}`,
        sql`${leaveRequests.endDate} >= ${rangeStart}`
      )
    );
}

export async function create(
  { employee_id, leave_type, start_date, end_date, reason }: any,
  actorId: number | null = null
) {
  const result = await db.insert(leaveRequests).values({
    employeeId: employee_id,
    leaveType: leave_type,
    startDate: start_date,
    endDate: end_date,
    reason,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select(leaveRequestsColumns).from(leaveRequests).where(eq(leaveRequests.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function findWithEmployeeById(id: number | string) {
  const rows = await db
    .select({
      ...leaveRequestsColumns,
      employee_name: requester.name,
      designation: requesterDesignation.title,
      department: requesterDepartment.name,
    })
    .from(leaveRequests)
    .innerJoin(requester, eq(leaveRequests.employeeId, requester.id))
    .leftJoin(requesterDesignation, eq(requester.designationId, requesterDesignation.id))
    .leftJoin(requesterDepartment, eq(requester.departmentId, requesterDepartment.id))
    .where(eq(leaveRequests.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function approve(id: number | string, reviewerId: number | null = null) {
  const leaveId = Number(id);

  return db.transaction(async (tx) => {
    const [result] = await tx
      .update(leaveRequests)
      .set({
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        updatedBy: reviewerId,
      })
      .where(eq(leaveRequests.id, leaveId));

    if (result.affectedRows === 0) return null;

    const [row] = await tx
      .select(leaveRequestsColumns)
      .from(leaveRequests)
      .where(eq(leaveRequests.id, leaveId));

    return row ?? null;
  });
}

export async function approveExternally(id: number | string) {
  await db.update(leaveRequests).set({ status: 'approved', reviewedAt: new Date() }).where(eq(leaveRequests.id, Number(id)));
}

export async function findApprovedForEmployeeInRange(employeeId: number | string, startDate: string, endDate: string) {
  const rows = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, Number(employeeId)),
        eq(leaveRequests.status, 'approved'),
        eq(leaveRequests.startDate, startDate),
        eq(leaveRequests.endDate, endDate)
      )
    )
    .limit(1);
  return rows[0] || null;
}

export async function reject(id: number | string, reviewerId: number = null) {
  await db
    .update(leaveRequests)
    .set({ status: 'rejected', reviewedBy: reviewerId, reviewedAt: new Date(), updatedBy: reviewerId })
    .where(eq(leaveRequests.id, Number(id)));
}

export async function incrementBalanceTaken(employeeId: number | string, leaveType: string, year: number, days: number) {
  await db
    .update(leaveBalances)
    .set({ taken: sql`${leaveBalances.taken} + ${days}` })
    .where(
      and(
        eq(leaveBalances.employeeId, Number(employeeId)),
        eq(leaveBalances.leaveType, leaveType as any),
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
    .set({ leaveType: leave_type, startDate: start_date, endDate: end_date, reason, updatedBy: actorId })
    .where(eq(leaveRequests.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(leaveRequests).where(eq(leaveRequests.id, Number(id)));
}
