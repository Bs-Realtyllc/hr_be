import { eq, and, gt, lte, isNull, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { employees, twoFactorEmailTokens, trustedDevices } from '../models';

export async function findSecurityFieldsById(employeeId: number) {
  const rows = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      two_factor_enabled: employees.two_factor_enabled,
      two_factor_secret: employees.two_factor_secret,
      two_factor_backup_codes: employees.two_factor_backup_codes,
    })
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);
  return rows[0] || null;
}

export async function enableTwoFactor(employeeId: number, encryptedSecret: string, hashedBackupCodes: string[]) {
  await db
    .update(employees)
    .set({ two_factor_enabled: true, two_factor_secret: encryptedSecret, two_factor_backup_codes: hashedBackupCodes })
    .where(eq(employees.id, employeeId));
}

export async function disableTwoFactor(employeeId: number) {
  await db
    .update(employees)
    .set({ two_factor_enabled: false, two_factor_secret: null, two_factor_backup_codes: null })
    .where(eq(employees.id, employeeId));
}

export async function updateBackupCodes(employeeId: number, hashedBackupCodes: string[]) {
  await db.update(employees).set({ two_factor_backup_codes: hashedBackupCodes }).where(eq(employees.id, employeeId));
}

// ── Email OTP fallback ────────────────────────────────────────────────────────

export async function invalidateActiveEmailTokens(employeeId: number) {
  await db
    .delete(twoFactorEmailTokens)
    .where(and(eq(twoFactorEmailTokens.employee_id, employeeId), isNull(twoFactorEmailTokens.used_at), gt(twoFactorEmailTokens.expires_at, new Date())));
}

export async function createEmailToken(employeeId: number, codeHash: string, expiresAt: Date) {
  await db.insert(twoFactorEmailTokens).values({ employee_id: employeeId, code_hash: codeHash, expires_at: expiresAt });
}

export async function findValidEmailToken(employeeId: number, codeHash: string) {
  const rows = await db
    .select()
    .from(twoFactorEmailTokens)
    .where(
      and(
        eq(twoFactorEmailTokens.employee_id, employeeId),
        eq(twoFactorEmailTokens.code_hash, codeHash),
        isNull(twoFactorEmailTokens.used_at),
        gt(twoFactorEmailTokens.expires_at, new Date())
      )
    )
    .limit(1);
  return rows[0] || null;
}

export async function markEmailTokenUsed(id: number) {
  await db.update(twoFactorEmailTokens).set({ used_at: new Date() }).where(eq(twoFactorEmailTokens.id, id));
}

// ── Trusted devices ────────────────────────────────────────────────────────────

interface NewTrustedDeviceInput {
  employeeId: number;
  tokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}

export async function createTrustedDevice({ employeeId, tokenHash, ipAddress, userAgent, expiresAt }: NewTrustedDeviceInput) {
  await db.insert(trustedDevices).values({
    employee_id: employeeId,
    token_hash: tokenHash,
    ip_address: ipAddress ?? null,
    user_agent: userAgent ?? null,
    expires_at: expiresAt,
  });
}

export async function deleteExpiredForEmployee(employeeId: number) {
  await db.delete(trustedDevices).where(and(eq(trustedDevices.employee_id, employeeId), lte(trustedDevices.expires_at, new Date())));
}

export async function findActiveByTokenHash(employeeId: number, tokenHash: string) {
  const rows = await db
    .select()
    .from(trustedDevices)
    .where(and(eq(trustedDevices.employee_id, employeeId), eq(trustedDevices.token_hash, tokenHash), gt(trustedDevices.expires_at, new Date())))
    .limit(1);
  return rows[0] || null;
}

export async function touchLastUsed(id: number) {
  await db.update(trustedDevices).set({ last_used_at: new Date() }).where(eq(trustedDevices.id, id));
}

export async function findActiveForEmployee(employeeId: number) {
  return db
    .select({
      id: trustedDevices.id,
      ip_address: trustedDevices.ip_address,
      user_agent: trustedDevices.user_agent,
      created_at: trustedDevices.created_at,
      last_used_at: trustedDevices.last_used_at,
      expires_at: trustedDevices.expires_at,
    })
    .from(trustedDevices)
    .where(and(eq(trustedDevices.employee_id, employeeId), gt(trustedDevices.expires_at, new Date())))
    .orderBy(desc(trustedDevices.last_used_at));
}

export async function deleteById(employeeId: number, id: number) {
  const result: any = await db.delete(trustedDevices).where(and(eq(trustedDevices.id, id), eq(trustedDevices.employee_id, employeeId)));
  return result[0]?.affectedRows ?? 0;
}

export async function deleteAllForEmployee(employeeId: number) {
  const result: any = await db.delete(trustedDevices).where(eq(trustedDevices.employee_id, employeeId));
  return result[0]?.affectedRows ?? 0;
}
