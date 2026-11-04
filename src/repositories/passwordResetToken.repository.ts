import { eq, and, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { passwordResetTokens } from '../../drizzle/schema';

const passwordResetTokensColumns = {
  id: passwordResetTokens.id,
  employee_id: passwordResetTokens.employeeId,
  token: passwordResetTokens.token,
  expires_at: passwordResetTokens.expiresAt,
  used_at: passwordResetTokens.usedAt,
  created_at: passwordResetTokens.createdAt,
  updated_at: passwordResetTokens.updatedAt,
  created_by: passwordResetTokens.createdBy,
  updated_by: passwordResetTokens.updatedBy,
};

export async function invalidateActiveForEmployee(employeeId: number | string) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.employeeId, Number(employeeId)), isNull(passwordResetTokens.usedAt)));
}

export async function create(employeeId: number | string, token: string, expiresAt: Date, actorId: number | null = null) {
  await db.insert(passwordResetTokens).values({
    employeeId: Number(employeeId),
    token,
    expiresAt,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date(),
  });
}

export async function findValidByToken(token: string) {
  const rows = await db
    .select(passwordResetTokensColumns)
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);
  return rows[0] || null;
}

export async function markUsed(id: number | string) {
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, Number(id)));
}
