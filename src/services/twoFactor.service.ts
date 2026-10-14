import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import AppError from '../pkg/AppError';
import * as employeeRepo from '../repositories/employee.repository';
import * as twoFactorRepo from '../repositories/twoFactor.repository';
import { encryptSecret, decryptSecret, hashBackupCode, generateBackupCodes } from '../pkg/twoFactorCrypto';

authenticator.options = { window: 1 };

const APP_NAME = 'HR Platform';
const EMAIL_OTP_EXPIRY_MINS = 10;

async function sendTwoFactorEmailOtp(name: string, to: string, code: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: 'HR Platform — Login Verification Code',
    html: `
      <p>Hi ${name},</p>
      <p>You are attempting to log in to the HR Platform. Your verification code is:</p>
      <h2 style="font-size: 24px; color: #4f46e5; letter-spacing: 4px; font-family: monospace;">${code}</h2>
      <p>This code expires in <strong>${EMAIL_OTP_EXPIRY_MINS} minutes</strong>.</p>
      <p>If you didn't request this, please change your password immediately.</p>
      <p style="color:#888;font-size:12px">HR Platform Security</p>
    `,
  });
}

export async function generateSetup(employeeId: number) {
  const emp = await twoFactorRepo.findSecurityFieldsById(employeeId);
  if (!emp) throw new AppError('Employee not found', 404);
  if (emp.two_factor_enabled) throw new AppError('2FA is already enabled', 400);

  const secret = authenticator.generateSecret(32);
  const otpauthUrl = authenticator.keyuri(emp.email, APP_NAME, secret);
  const qrDataUrl = await qrcode.toDataURL(otpauthUrl);

  return { secret, otpauthUrl, qrDataUrl };
}

export async function enableTwoFactor(employeeId: number, code: string, secret: string) {
  const emp = await twoFactorRepo.findSecurityFieldsById(employeeId);
  if (!emp) throw new AppError('Employee not found', 404);
  if (emp.two_factor_enabled) throw new AppError('2FA is already enabled', 400);

  const valid = authenticator.verify({ token: code, secret });
  if (!valid) throw new AppError('Invalid verification code', 400);

  const { plain, hashed } = generateBackupCodes();
  await twoFactorRepo.enableTwoFactor(employeeId, encryptSecret(secret), hashed);

  return { backupCodes: plain };
}

export async function disableTwoFactor(employeeId: number, password: string, code: string) {
  const passwordHash = await employeeRepo.findPasswordHashById(employeeId);
  if (!passwordHash) throw new AppError('Employee not found', 404);

  const emp = await twoFactorRepo.findSecurityFieldsById(employeeId);
  if (!emp?.two_factor_enabled || !emp.two_factor_secret) throw new AppError('2FA is not enabled', 400);

  const passwordValid = await bcrypt.compare(password, passwordHash);
  if (!passwordValid) throw new AppError('Invalid password', 401);

  const secret = decryptSecret(emp.two_factor_secret);
  const codeValid = authenticator.verify({ token: code, secret });
  if (!codeValid) throw new AppError('Invalid authenticator code', 400);

  await twoFactorRepo.disableTwoFactor(employeeId);
  await twoFactorRepo.deleteAllForEmployee(employeeId);
}

export async function regenerateBackupCodes(employeeId: number, code: string) {
  const emp = await twoFactorRepo.findSecurityFieldsById(employeeId);
  if (!emp?.two_factor_enabled || !emp.two_factor_secret) throw new AppError('2FA is not enabled', 400);

  const secret = decryptSecret(emp.two_factor_secret);
  const valid = authenticator.verify({ token: code, secret });
  if (!valid) throw new AppError('Invalid authenticator code', 400);

  const { plain, hashed } = generateBackupCodes();
  await twoFactorRepo.updateBackupCodes(employeeId, hashed);

  return { backupCodes: plain };
}

export async function getTwoFactorStatus(employeeId: number) {
  const emp = await twoFactorRepo.findSecurityFieldsById(employeeId);
  if (!emp) throw new AppError('Employee not found', 404);
  const backupCodes = (emp.two_factor_backup_codes as string[] | null) || [];
  return { enabled: emp.two_factor_enabled, backupCodesRemaining: backupCodes.length };
}

// ── Verification during login (acts on the employee resolved from the temp token) ──

export async function verifyTotpCode(employeeId: number, code: string) {
  const emp = await twoFactorRepo.findSecurityFieldsById(employeeId);
  if (!emp?.two_factor_enabled || !emp.two_factor_secret) throw new AppError('2FA is not enabled for this account', 400);

  const secret = decryptSecret(emp.two_factor_secret);
  const valid = authenticator.verify({ token: code, secret });
  if (!valid) throw new AppError('Invalid authenticator code', 400);
}

export async function verifyBackupCode(employeeId: number, code: string) {
  const emp = await twoFactorRepo.findSecurityFieldsById(employeeId);
  if (!emp?.two_factor_enabled) throw new AppError('2FA is not enabled', 400);

  const backupCodes = (emp.two_factor_backup_codes as string[] | null) || [];
  const normalised = code.toUpperCase().replace(/\s/g, '');
  const inputHash = hashBackupCode(normalised);
  const idx = backupCodes.indexOf(inputHash);
  if (idx === -1) throw new AppError('Invalid backup code', 400);

  const remaining = [...backupCodes];
  remaining.splice(idx, 1);
  await twoFactorRepo.updateBackupCodes(employeeId, remaining);
}

export async function sendEmailOtp(employeeId: number) {
  const emp = await twoFactorRepo.findSecurityFieldsById(employeeId);
  if (!emp?.two_factor_enabled) throw new AppError('2FA is not enabled', 400);

  await twoFactorRepo.invalidateActiveEmailTokens(employeeId);

  const plainCode = crypto.randomInt(100000, 999999).toString();
  const codeHash = crypto.createHash('sha256').update(plainCode).digest('hex');
  const expiresAt = new Date(Date.now() + EMAIL_OTP_EXPIRY_MINS * 60 * 1000);

  await twoFactorRepo.createEmailToken(employeeId, codeHash, expiresAt);

  if (process.env.MAIL_HOST) {
    sendTwoFactorEmailOtp(emp.name, emp.email, plainCode).catch((err: any) =>
      console.error('[2fa] Failed to send email OTP:', err.message)
    );
  } else {
    console.info(`[2fa] MAIL_HOST not set — email OTP for employee ${employeeId} is ${plainCode}`);
  }
}

export async function verifyEmailOtp(employeeId: number, code: string) {
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const record = await twoFactorRepo.findValidEmailToken(employeeId, codeHash);
  if (!record) throw new AppError('Invalid or expired verification code', 400);
  await twoFactorRepo.markEmailTokenUsed(record.id);
}

// ── Trusted devices ────────────────────────────────────────────────────────────

const TRUSTED_DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashDeviceToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createTrustedDevice(employeeId: number, { ipAddress, userAgent }: { ipAddress?: string | null; userAgent?: string | null }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await Promise.all([
    twoFactorRepo.createTrustedDevice({
      employeeId,
      tokenHash: hashDeviceToken(rawToken),
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + TRUSTED_DEVICE_TTL_MS),
    }),
    twoFactorRepo.deleteExpiredForEmployee(employeeId),
  ]);
  return rawToken;
}

export async function isTrustedDevice(employeeId: number, rawToken: string | null | undefined) {
  if (!rawToken) return false;
  const device = await twoFactorRepo.findActiveByTokenHash(employeeId, hashDeviceToken(rawToken));
  if (!device) return false;
  await twoFactorRepo.touchLastUsed(device.id);
  return true;
}

export async function getTrustedDevices(employeeId: number) {
  return twoFactorRepo.findActiveForEmployee(employeeId);
}

export async function revokeTrustedDevice(employeeId: number, deviceId: number) {
  const affected = await twoFactorRepo.deleteById(employeeId, deviceId);
  if (!affected) throw new AppError('Trusted device not found', 404);
}

export async function revokeAllTrustedDevices(employeeId: number) {
  const revokedCount = await twoFactorRepo.deleteAllForEmployee(employeeId);
  return { revokedCount };
}
