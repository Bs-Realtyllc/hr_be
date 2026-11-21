import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { positions, departments, employees } from '../../drizzle/schema';
import AppError from '../pkg/AppError';

const MAX_POSITION_CHAIN_DEPTH = 20;

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const reportsTo = alias(positions, 'reports_to');
const incumbent = alias(employees, 'incumbent');

const positionColumns = {
  id: positions.id,
  title: positions.title,
  rank: positions.rank,
  department_id: positions.departmentId,
  reports_to_position_id: positions.reportsToPositionId,
  is_active: positions.isActive,
  created_at: positions.createdAt,
};

export async function create(data: {
  title: string;
  rank?: number | null;
  departmentId: number;
  reportsToPositionId?: number | null;
}) {
  const result = await db.insert(positions).values({
    title: data.title,
    rank: data.rank ?? null,
    departmentId: data.departmentId,
    reportsToPositionId: data.reportsToPositionId ?? null,
  } as any);
  return insertedId(result);
}

export async function update(
  id: number | string,
  data: { title?: string; rank?: number | null; departmentId?: number; reportsToPositionId?: number | null }
) {
  const setValues: Record<string, any> = {};
  if (data.title !== undefined) setValues.title = data.title;
  if (data.rank !== undefined) setValues.rank = data.rank;
  if (data.departmentId !== undefined) setValues.departmentId = data.departmentId;
  if (data.reportsToPositionId !== undefined) setValues.reportsToPositionId = data.reportsToPositionId;
  await db.update(positions).set(setValues).where(eq(positions.id, Number(id)));
}

export async function deactivate(id: number | string) {
  await db.update(positions).set({ isActive: false }).where(eq(positions.id, Number(id)));
}

export async function findById(id: number | string) {
  const rows = await db
    .select({
      ...positionColumns,
      department_name: departments.name,
      reports_to_title: reportsTo.title,
    })
    .from(positions)
    .leftJoin(departments, eq(positions.departmentId, departments.id))
    .leftJoin(reportsTo as any, eq(positions.reportsToPositionId, reportsTo.id))
    .where(eq(positions.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function findAllActive() {
  return db
    .select({
      ...positionColumns,
      department_name: departments.name,
      reports_to_title: reportsTo.title,
      incumbent_id: incumbent.id,
      incumbent_name: incumbent.name,
    })
    .from(positions)
    .leftJoin(departments, eq(positions.departmentId, departments.id))
    .leftJoin(reportsTo as any, eq(positions.reportsToPositionId, reportsTo.id))
    .leftJoin(incumbent, eq(incumbent.positionId, positions.id))
    .where(eq(positions.isActive, true))
    .orderBy(positions.title);
}

// Who currently fills this seat, if anyone — a position can legitimately be vacant.
export async function findIncumbent(positionId: number | string) {
  const rows = await db
    .select({ id: employees.id, name: employees.name, email: employees.email, role: employees.role })
    .from(employees)
    .where(eq(employees.positionId, Number(positionId)))
    .limit(1);
  return rows[0] || null;
}

// Walks employee -> position -> reports_to_position -> whoever holds that seat.
// Returns null if the employee has no position, the position has nothing above it, or that seat is vacant.
export async function findManagerViaPosition(employeeId: number | string) {
  const empRows = await db
    .select({ position_id: employees.positionId })
    .from(employees)
    .where(eq(employees.id, Number(employeeId)))
    .limit(1);
  const positionId = empRows[0]?.position_id;
  if (!positionId) return null;

  const posRows = await db
    .select({ reports_to_position_id: positions.reportsToPositionId })
    .from(positions)
    .where(eq(positions.id, positionId))
    .limit(1);
  const reportsToPositionId = posRows[0]?.reports_to_position_id;
  if (!reportsToPositionId) return null;

  return findIncumbent(reportsToPositionId);
}

export async function findPositionsReportingTo(positionId: number | string) {
  return db
    .select({ id: positions.id, title: positions.title })
    .from(positions)
    .where(and(eq(positions.reportsToPositionId, Number(positionId)), eq(positions.isActive, true)));
}

export async function assertNoPositionCycle(
  positionId: number | string,
  proposedReportsToId: number | string | null | undefined,
) {
  if (proposedReportsToId == null) return;
  if (Number(proposedReportsToId) === Number(positionId)) {
    throw new AppError('A position cannot report to itself', 400);
  }
  let currentId = Number(proposedReportsToId);
  for (let depth = 0; depth < MAX_POSITION_CHAIN_DEPTH; depth++) {
    const rows = await db
      .select({ reports_to_position_id: positions.reportsToPositionId })
      .from(positions)
      .where(eq(positions.id, currentId))
      .limit(1);
    const nextId = rows[0]?.reports_to_position_id;
    if (nextId == null) return;
    if (Number(nextId) === Number(positionId)) {
      throw new AppError('This would create a reporting cycle between positions', 400);
    }
    currentId = nextId;
  }
  console.warn(`assertNoPositionCycle: position chain from ${proposedReportsToId} exceeded depth ${MAX_POSITION_CHAIN_DEPTH}`);
}
