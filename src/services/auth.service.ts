import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import * as employeeRepo from '../repositories/employee.repository';
import * as passwordResetTokenRepo from '../repositories/passwordResetToken.repository';
import * as otpRepo from '../repositories/otpCode.repository';
import * as authDto from '../dtos/auth.dto';
import type { LoginInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput } from '../dtos/auth.dto';
import AppError from '../pkg/AppError';


function unauthorized(message: string): never {
  throw new AppError(message, 401);
}

export async function sendResetEmail(name: string, to: string, resetLink: string) {
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
    subject: 'HR Platform — Password Reset',
    html: `
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the link below to set a new password.
         This link expires in <strong>1 hour</strong>.</p>
      <p><a href="${resetLink}" style="color:#4f46e5;font-weight:bold">Reset My Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#888;font-size:12px">HR Platform</p>
    `,
  });
}

export async function sendOtpEmail(name: string, to: string, code: string) {
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
    subject: 'HR Platform — Admin Login OTP',
    html: `
      <p>Hi ${name},</p>
      <p>You are attempting to log in to the HR Platform. Your OTP code for admin verification is:</p>
      <h2 style="font-size: 24px; color: #4f46e5; letter-spacing: 4px; font-family: monospace;">${code}</h2>
      <p>This code expires in <strong>5 minutes</strong>.</p>
      <p>If you didn't request this, please change your password immediately.</p>
      <p style="color:#888;font-size:12px">HR Platform Security</p>
    `,
  });
}

export async function login({ email, password }: LoginInput, ip: string = 'unknown') {
  console.log(`[auth] Login attempt for ${email} (IP: ${ip})`);

  const emp = await employeeRepo.findAuthByEmail(email);
  if (!emp?.password_hash) unauthorized('Invalid credentials');

  const valid = await bcrypt.compare(password, emp!.password_hash);
  if (!valid) unauthorized('Invalid credentials');

  if (emp.role === 'admin') {
    await otpRepo.invalidateAllForEmployee(emp.id);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await otpRepo.create(emp.id, codeHash, expiresAt);

    if (process.env.MAIL_HOST) {
      try {
        await sendOtpEmail(emp.name, email, otp);
      } catch (mailErr: any) {
        console.error(`[auth] Failed to send OTP email to ${email}:`, mailErr.message);
      }
    } else {
      console.info(`[auth] MAIL_HOST not set — OTP for ${email} is ${otp}`);
    }

    const tempToken = jwt.sign(
      { employeeId: emp.id, purpose: 'admin_otp' },
      process.env.JWT_SECRET as string,
      { expiresIn: '5m' }
    );

    console.log(`[audit] OTP generated for employee ID ${emp.id} (IP: ${ip})`);
    return { requiresOtp: true, tempToken };
  }

  console.log(`[audit] ${emp!.name} (${email}) logged in successfully (IP: ${ip})`);

  const user = authDto.toLoginResponse(emp!);
  const token = jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: '2d' });
  return { token, user };
}

export async function verifyOtp({ code, tempToken, ip }: { code: string; tempToken: string; ip: string }) {
  let decoded: any;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET as string);
  } catch (err: any) {
    throw new AppError('Invalid or expired temporary session. Please try logging in again.', 401);
  }

  if (decoded.purpose !== 'admin_otp' || !decoded.employeeId) {
    throw new AppError('Invalid token purpose', 400);
  }

  const employeeId = decoded.employeeId;
  const otpRow = await otpRepo.findLatestActive(employeeId);

  if (!otpRow) {
    console.warn(`[audit] OTP verification failed (no active OTP) for employee ID ${employeeId} (IP: ${ip})`);
    throw new AppError('No active verification session found. Please try logging in again.', 400);
  }

  if (otpRow.attempts >= otpRow.max_attempts) {
    console.warn(`[audit] OTP verification blocked (max attempts exceeded) for employee ID ${employeeId} (IP: ${ip})`);
    throw new AppError('Too many failed verification attempts. Please log in again to receive a new code.', 429);
  }

  const valid = await bcrypt.compare(code, otpRow.code_hash);
  if (!valid) {
    await otpRepo.incrementAttempts(otpRow.id);
    console.warn(`[audit] OTP verification failed (incorrect code) for employee ID ${employeeId} (attempt ${otpRow.attempts + 1}/${otpRow.max_attempts}) (IP: ${ip})`);
    throw new AppError('Invalid verification code.', 400);
  }

  // OTP is valid!
  await otpRepo.markUsed(otpRow.id);
  console.log(`[audit] OTP verification succeeded for employee ID ${employeeId} (IP: ${ip})`);

  const emp = await employeeRepo.findAuthById(employeeId);
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
