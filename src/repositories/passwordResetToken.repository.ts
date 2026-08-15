import { eq, and, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { passwordResetTokens } from '../models';

export async function invalidateActiveForEmployee(employeeId: number | string) {
  await db
    .update(passwordResetTokens)
    .set({ used_at: new Date() })
    .where(and(eq(passwordResetTokens.employee_id, Number(employeeId)), isNull(passwordResetTokens.used_at)));
}

export async function create(employeeId: number | string, token: string, expiresAt: Date, actorId: number | null = null) {
  await db.insert(passwordResetTokens).values({
    employee_id: Number(employeeId),
    token,
    expires_at: expiresAt,
    created_by: actorId,
    updated_by: actorId,
    created_at: new Date(),
  });
}

export async function findValidByToken(token: string) {
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), isNull(passwordResetTokens.used_at), gt(passwordResetTokens.expires_at, new Date())))
    .limit(1);
  return rows[0] || null;
}

export async function markUsed(id: number | string) {
  await db.update(passwordResetTokens).set({ used_at: new Date() }).where(eq(passwordResetTokens.id, Number(id)));
}
