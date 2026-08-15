import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import * as employeeRepo from '../repositories/employee.repository';
import * as passwordResetTokenRepo from '../repositories/passwordResetToken.repository';
import * as authDto from '../dtos/auth.dto';

function unauthorized(message: string): never {
  const err: any = new Error(message);
  err.status = 401;
  throw err;
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

export async function login(body: unknown) {
  const { email, password } = authDto.toLoginInput(body);

  console.log(`[auth] Login attempt for ${email}`);

  const emp = await employeeRepo.findAuthByEmail(email);
  if (!emp?.password_hash) unauthorized('Invalid credentials');

  const valid = await bcrypt.compare(password, emp!.password_hash);
  if (!valid) unauthorized('Invalid credentials');

  console.log(`[auth] ${emp!.name} (${email}) logged in successfully`);

  const user = authDto.toLoginResponse(emp!);
  const token = jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  return { token, user };
}

export async function changePassword(userId: number, body: unknown) {
  const { current_password, new_password } = authDto.toChangePasswordInput(body);

  const currentHash = await employeeRepo.findPasswordHashById(userId);
  if (currentHash) {
    const valid = await bcrypt.compare(current_password || '', currentHash);
    if (!valid) unauthorized('Current password is incorrect');
  }

  const hash = await bcrypt.hash(new_password, 10);
  await employeeRepo.updatePasswordHash(userId, hash);
}

export async function forgotPassword(body: unknown) {
  const { email } = authDto.toForgotPasswordInput(body);

  const emp = await employeeRepo.findActiveBasicByEmail(email);

  // Always respond the same way to prevent email enumeration — caller (controller)
  // sends the generic message regardless of what this function does internally.
  if (!emp) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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

export async function resetPassword(body: unknown) {
  const { token, new_password } = authDto.toResetPasswordInput(body);

  const row = await passwordResetTokenRepo.findValidByToken(token);
  if (!row) {
    const err: any = new Error('Invalid or expired reset link. Please request a new one.');
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(new_password, 10);
  await employeeRepo.updatePasswordHash(row.employee_id, hash);
  await passwordResetTokenRepo.markUsed(row.id);
}
