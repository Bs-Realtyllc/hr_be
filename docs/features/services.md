---
# src/services/auth.service.ts

import * as employeeRepo from '../repositories/employee.repository';
import * as otpRepo from '../repositories/otp.repository';
import * as passwordResetTokenRepo from '../repositories/passwordResetToken.repository';
import type { AuthCreateInput, AuthLoginInput, ForgotPasswordInput, ResetPasswordInput } from '../dtos/auth.dto';
import type { CultureEventCreateInput } from '../dtos/cultureEvent.dto';
import type { EmailSettingsSaveInput } from '../dtos/emailSettings.dto';
import { AppError } from '../pkg/AppError';
import { crypto, jwt } from '../utils/helpers';
import { unauthorized } from '../utils/errors';
import { sendResetEmail } from '../utils/sendEmail';
import { testSmtpAsync } from '../utils/testSmtp';

export async function login(authDto: AuthLoginInput, ip: string) {
  // Check if the OTP is valid
  const otp = await otpRepo.findActiveByToken(authDto.otp);
  if (!otp) {
    throw unauthorized('OTP is either invalid or expired.');
  }

  // Mark the OTP as used
  await otpRepo.markUsed(otp.id);
  console.log(`[audit] OTP verification succeeded for IP: ${ip}`);

  const emp = await employeeRepo.findAuthById(otp.employee_id);
  if (!emp) {
    throw new AppError('Employee not found or inactive.', 404);
  }

  const user = authDto.toLoginResponse(emp);
  const token = jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  return { token, user };
}

export async function verifyOTP(authDto: AuthCreateInput, ip: string) {
  // Check if the OTP is valid
  const otp = await otpRepo.findActiveByToken(authDto.otp);
  if (!otp) {
    throw unauthorized('OTP is either invalid or expired.');
  }

  // Mark the OTP as used
  await otpRepo.markUsed(otp.id);
  console.log(`[audit] OTP verification succeeded for employee ID ${otp.employee_id} (IP: ${ip})`);

  const emp = await employeeRepo.findAuthById(otp.employee_id);
  if (!emp) {
    throw new AppError('Employee not found or inactive.', 404);
  }

  const user = authDto.toLoginResponse(emp);
  const token = jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  return { token, user };
}

export async function changePassword(userId: number, { current_password, new_password }: ChangePasswordInput) {
  const currentHash = await employeeRepo.findPasswordHashById(userId);
  if (currentHash) {
    const valid = await bcrypt.compare(current_password || '', currentHash);
    if (!valid) unauthorized('Current password is incorrect');
  }

  const hash = await bcrypt.hash(new_password, 10);
  await employeeRepo.updatePasswordHash(userId, hash);
}

export async function forgotPassword({ email }: ForgotPasswordInput) {
  const emp = await employeeRepo.findActiveBasicByEmail(email);

  if (!emp) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await passwordResetTokenRepo.invalidateActiveForEmployee(emp.id);
  await passwordResetTokenRepo.create(emp.id, token, expiresAt);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  if (process.env.MAIL_HOST) {
    try {
      await sendResetEmail(emp.name, email, resetLink);
    } catch (mailErr: any) {
      console.error('[auth] Failed to send reset email:', mailErr.message);
    }
  } else {
    console.info(`[auth] MAIL_HOST not set — reset link for ${email}: ${resetLink}`);
  }
}

export async function resetPassword({ token, new_password }: ResetPasswordInput) {
  const row = await passwordResetTokenRepo.findValidByToken(token);
  if (!row) {
    throw new AppError('Invalid or expired reset link. Please request a new one.', 400);
  }

  const hash = await bcrypt.hash(new_password, 10);
  await employeeRepo.updatePasswordHash(row.employee_id, hash);
  await passwordResetTokenRepo.markUsed(row.id);
}
---
