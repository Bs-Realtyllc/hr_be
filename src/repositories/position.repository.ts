import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { positions, departments, employees, employeePositions } from '../../drizzle/schema';
import AppError from '../pkg/AppError';

const MAX_POSITION_CHAIN_DEPTH = 20;

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const reportsTo = alias(positions, 'reports_to');
const incumbent = alias(employees, 'incumbent');
const incumbentLink = alias(employeePositions, 'incumbent_ep');

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
    .leftJoin(incumbentLink as any, eq(incumbentLink.positionId, positions.id))
    .leftJoin(incumbent, eq(incumbent.id, incumbentLink.employeeId))
    .where(eq(positions.isActive, true))
    .orderBy(positions.title);
}

// Who currently fills this seat, if anyone — a position can legitimately be vacant.
// position_id is unique in employee_positions, so this is always 0 or 1 person,
// regardless of whether it's that person's primary or an additional position.
export async function findIncumbent(positionId: number | string) {
  const rows = await db
    .select({ id: employees.id, name: employees.name, email: employees.email, role: employees.role })
    .from(employeePositions)
    .innerJoin(employees, eq(employees.id, employeePositions.employeeId))
    .where(eq(employeePositions.positionId, Number(positionId)))
    .limit(1);
  return rows[0] || null;
}

// Walks employee -> primary position -> reports_to_position -> whoever holds that seat.
// Keys off the primary position only, even for a multiposition employee — this is
// what leave-approval/notification routing uses, so there's one unambiguous answer.
export async function findManagerViaPosition(employeeId: number | string) {
  const positionId = await findPrimaryPositionId(employeeId);
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

export async function findPrimaryPositionId(employeeId: number | string) {
  const rows = await db
    .select({ position_id: employeePositions.positionId })
    .from(employeePositions)
    .where(and(eq(employeePositions.employeeId, Number(employeeId)), eq(employeePositions.isPrimary, true)))
    .limit(1);
  return rows[0]?.position_id ?? null;
}

// All positions a "multiposition worker" currently holds, with is_primary flagged.
export async function findPositionsForEmployee(employeeId: number | string) {
  return db
    .select({
      id: positions.id,
      title: positions.title,
      department_id: positions.departmentId,
      department_name: departments.name,
      reports_to_position_id: positions.reportsToPositionId,
      reports_to_title: reportsTo.title,
      is_primary: employeePositions.isPrimary,
    })
    .from(employeePositions)
    .innerJoin(positions, eq(employeePositions.positionId, positions.id))
    .leftJoin(departments, eq(positions.departmentId, departments.id))
    .leftJoin(reportsTo as any, eq(positions.reportsToPositionId, reportsTo.id))
    .where(eq(employeePositions.employeeId, Number(employeeId)))
    .orderBy(positions.title);
}

export async function addPosition(employeeId: number | string, positionId: number | string, isPrimary: boolean) {
  await db.transaction(async (tx) => {
    if (isPrimary) {
      await tx.update(employeePositions).set({ isPrimary: false }).where(eq(employeePositions.employeeId, Number(employeeId)));
    }
    await tx.insert(employeePositions).values({
      employeeId: Number(employeeId),
      positionId: Number(positionId),
      isPrimary,
      createdAt: new Date(),
    } as any);
  });
}

export async function removePosition(employeeId: number | string, positionId: number | string) {
  await db
    .delete(employeePositions)
    .where(and(eq(employeePositions.employeeId, Number(employeeId)), eq(employeePositions.positionId, Number(positionId))));
}

export async function setPrimaryPosition(employeeId: number | string, positionId: number | string) {
  await db.transaction(async (tx) => {
    await tx.update(employeePositions).set({ isPrimary: false }).where(eq(employeePositions.employeeId, Number(employeeId)));
    await tx
      .update(employeePositions)
      .set({ isPrimary: true })
      .where(and(eq(employeePositions.employeeId, Number(employeeId)), eq(employeePositions.positionId, Number(positionId))));
  });
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
