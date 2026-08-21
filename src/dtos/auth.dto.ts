import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate } from '../pkg/validation';

const ALLOWED_DOMAINS = ['bsrealtyllc.com', 'gitgi.com', 'gmail.com'];

export interface LoginInput {
  email: string;
  password: string;
}
const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export function toLoginInput(body: unknown): LoginInput {
  const { email, password } = bindAndValidate(loginSchema, body, 'Email and password required');

  const domain = email.split('@')[1]?.toLowerCase();
  if (!ALLOWED_DOMAINS.includes(domain)) {
    throw new AppError('Access restricted to organization members only. Please use your company email.', 403);
  }
  return { email, password };
}

export interface ChangePasswordInput {
  current_password?: string;
  new_password: string;
}
const changePasswordSchema = z.object({
  current_password: z.string().optional(),
  new_password: z.string().min(6),
});

export function toChangePasswordInput(body: unknown): ChangePasswordInput {
  return bindAndValidate(changePasswordSchema, body, 'New password must be at least 6 characters');
}

export interface ForgotPasswordInput {
  email: string;
}
const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1),
});

export function toForgotPasswordInput(body: unknown): ForgotPasswordInput {
  return bindAndValidate(forgotPasswordSchema, body, 'Email required');
}

export interface ResetPasswordInput {
  token: string;
  new_password: string;
}
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(6),
});

export function toResetPasswordInput(body: unknown): ResetPasswordInput {
  return bindAndValidate(resetPasswordSchema, body, 'Token and new password (min 6 characters) are required');
}

export interface UserSummary {
  id: number;
  employeeId?: number;
  name: string;
  email: string;
  role: 'admin' | 'lead' | 'employee' | 'intern' | null;
  designation: string | null;
  department: string | null;
}

export function toLoginResponse(employee: UserSummary & { password_hash: string | null }): UserSummary {
  const { password_hash, ...user } = employee;
  return {
    ...user,
    employeeId: user.id,
  };
}

export interface VerifyOtpInput {
  code: string;
  tempToken: string;
}

const verifyOtpSchema = z.object({
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
  tempToken: z.string().min(1, 'Temporary token is required'),
});

export function toVerifyOtpInput(body: unknown): VerifyOtpInput {
  return bindAndValidate(verifyOtpSchema, body, 'OTP and temporary token are required');
}

