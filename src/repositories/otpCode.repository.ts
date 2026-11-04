import { eq, and, desc, gt, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { otpCodes } from '../../drizzle/schema';

const otpCodesColumns = {
  id: otpCodes.id,
  employee_id: otpCodes.employeeId,
  code_hash: otpCodes.codeHash,
  attempts: otpCodes.attempts,
  max_attempts: otpCodes.maxAttempts,
  expires_at: otpCodes.expiresAt,
  used_at: otpCodes.usedAt,
  created_at: otpCodes.createdAt,
  updated_at: otpCodes.updatedAt,
  created_by: otpCodes.createdBy,
  updated_by: otpCodes.updatedBy,
};

export async function create(employeeId: number, codeHash: string, expiresAt: Date) {
  const result = await db.insert(otpCodes).values({
    employeeId,
    codeHash,
    expiresAt,
  });
  return result[0].insertId;
}

export async function findLatestActive(employeeId: number) {
  const rows = await db
    .select(otpCodesColumns)
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.employeeId, employeeId),
        sql`${otpCodes.usedAt} IS NULL`,
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  return rows[0] || null;
}

export async function incrementAttempts(id: number) {
  await db
    .update(otpCodes)
    .set({ attempts: sql`attempts + 1` })
    .where(eq(otpCodes.id, id));
}

export async function markUsed(id: number) {
  await db
    .update(otpCodes)
    .set({ usedAt: new Date() })
    .where(eq(otpCodes.id, id));
}

export async function invalidateAllForEmployee(employeeId: number) {
  await db
    .update(otpCodes)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(otpCodes.employeeId, employeeId),
        sql`${otpCodes.usedAt} IS NULL`
      )
    );
}
