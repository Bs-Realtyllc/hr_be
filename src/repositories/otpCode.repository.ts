import { eq, and, desc, gt, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { otpCodes } from '../models/OtpCode';

export async function create(employeeId: number, codeHash: string, expiresAt: Date) {
  const result = await db.insert(otpCodes).values({
    employee_id: employeeId,
    code_hash: codeHash,
    expires_at: expiresAt,
  });
  return result[0].insertId;
}

export async function findLatestActive(employeeId: number) {
  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.employee_id, employeeId),
        sql`${otpCodes.used_at} IS NULL`,
        gt(otpCodes.expires_at, new Date())
      )
    )
    .orderBy(desc(otpCodes.created_at))
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
    .set({ used_at: new Date() })
    .where(eq(otpCodes.id, id));
}

export async function invalidateAllForEmployee(employeeId: number) {
  await db
    .update(otpCodes)
    .set({ used_at: new Date() })
    .where(
      and(
        eq(otpCodes.employee_id, employeeId),
        sql`${otpCodes.used_at} IS NULL`
      )
    );
}
