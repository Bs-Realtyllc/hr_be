import { eq, and, gt, lte, isNull, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { employees, twoFactorEmailTokens, trustedDevices } from '../../drizzle/schema';

const trustedDevicesColumns = {
  id: trustedDevices.id,
  employee_id: trustedDevices.employeeId,
  token_hash: trustedDevices.tokenHash,
  ip_address: trustedDevices.ipAddress,
  user_agent: trustedDevices.userAgent,
  expires_at: trustedDevices.expiresAt,
  created_at: trustedDevices.createdAt,
  last_used_at: trustedDevices.lastUsedAt,
};
const twoFactorEmailTokensColumns = {
  id: twoFactorEmailTokens.id,
  employee_id: twoFactorEmailTokens.employeeId,
  code_hash: twoFactorEmailTokens.codeHash,
  expires_at: twoFactorEmailTokens.expiresAt,
  used_at: twoFactorEmailTokens.usedAt,
  created_at: twoFactorEmailTokens.createdAt,
};

export async function findSecurityFieldsById(employeeId: number) {
  const rows = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      two_factor_enabled: employees.twoFactorEnabled,
      two_factor_secret: employees.twoFactorSecret,
      two_factor_backup_codes: employees.twoFactorBackupCodes,
    })
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);
  return rows[0] || null;
}

export async function enableTwoFactor(employeeId: number, encryptedSecret: string, hashedBackupCodes: string[]) {
  await db
    .update(employees)
    .set({ twoFactorEnabled: true, twoFactorSecret: encryptedSecret, twoFactorBackupCodes: hashedBackupCodes })
    .where(eq(employees.id, employeeId));
}

export async function disableTwoFactor(employeeId: number) {
  await db
    .update(employees)
    .set({ twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null })
    .where(eq(employees.id, employeeId));
}

export async function updateBackupCodes(employeeId: number, hashedBackupCodes: string[]) {
  await db.update(employees).set({ twoFactorBackupCodes: hashedBackupCodes }).where(eq(employees.id, employeeId));
}

// ── Email OTP fallback ────────────────────────────────────────────────────────

export async function invalidateActiveEmailTokens(employeeId: number) {
  await db
    .delete(twoFactorEmailTokens)
    .where(and(eq(twoFactorEmailTokens.employeeId, employeeId), isNull(twoFactorEmailTokens.usedAt), gt(twoFactorEmailTokens.expiresAt, new Date())));
}

export async function createEmailToken(employeeId: number, codeHash: string, expiresAt: Date) {
  await db.insert(twoFactorEmailTokens).values({ employeeId, codeHash, expiresAt });
}

export async function findValidEmailToken(employeeId: number, codeHash: string) {
  const rows = await db
    .select(twoFactorEmailTokensColumns)
    .from(twoFactorEmailTokens)
    .where(
      and(
        eq(twoFactorEmailTokens.employeeId, employeeId),
        eq(twoFactorEmailTokens.codeHash, codeHash),
        isNull(twoFactorEmailTokens.usedAt),
        gt(twoFactorEmailTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  return rows[0] || null;
}

export async function markEmailTokenUsed(id: number) {
  await db.update(twoFactorEmailTokens).set({ usedAt: new Date() }).where(eq(twoFactorEmailTokens.id, id));
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
    employeeId,
    tokenHash,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    expiresAt,
  });
}

export async function deleteExpiredForEmployee(employeeId: number) {
  await db.delete(trustedDevices).where(and(eq(trustedDevices.employeeId, employeeId), lte(trustedDevices.expiresAt, new Date())));
}

export async function findActiveByTokenHash(employeeId: number, tokenHash: string) {
  const rows = await db
    .select(trustedDevicesColumns)
    .from(trustedDevices)
    .where(and(eq(trustedDevices.employeeId, employeeId), eq(trustedDevices.tokenHash, tokenHash), gt(trustedDevices.expiresAt, new Date())))
    .limit(1);
  return rows[0] || null;
}

export async function touchLastUsed(id: number) {
  await db.update(trustedDevices).set({ lastUsedAt: new Date() }).where(eq(trustedDevices.id, id));
}

export async function findActiveForEmployee(employeeId: number) {
  return db
    .select({
      id: trustedDevices.id,
      ip_address: trustedDevices.ipAddress,
      user_agent: trustedDevices.userAgent,
      created_at: trustedDevices.createdAt,
      last_used_at: trustedDevices.lastUsedAt,
      expires_at: trustedDevices.expiresAt,
    })
    .from(trustedDevices)
    .where(and(eq(trustedDevices.employeeId, employeeId), gt(trustedDevices.expiresAt, new Date())))
    .orderBy(desc(trustedDevices.lastUsedAt));
}

export async function deleteById(employeeId: number, id: number) {
  const result: any = await db.delete(trustedDevices).where(and(eq(trustedDevices.id, id), eq(trustedDevices.employeeId, employeeId)));
  return result[0]?.affectedRows ?? 0;
}

export async function deleteAllForEmployee(employeeId: number) {
  const result: any = await db.delete(trustedDevices).where(eq(trustedDevices.employeeId, employeeId));
  return result[0]?.affectedRows ?? 0;
}
