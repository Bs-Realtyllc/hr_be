import { z } from 'zod';

const ALLOWED_DOMAINS = ['bsrealtyllc.com', 'gitgi.com'];

function badRequest(message: string, status = 400) {
  const err: any = new Error(message);
  err.status = status;
  return err;
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, message?: string): T {
  const result = schema.safeParse(data);
  if (!result.success) throw badRequest(message || result.error.issues[0].message);
  return result.data;
}

export interface LoginInput {
  email: string;
  password: string;
}
const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export function toLoginInput(body: unknown): LoginInput {
  const { email, password } = parseOrThrow(loginSchema, body, 'Email and password required');

  const domain = email.split('@')[1]?.toLowerCase();
  if (!ALLOWED_DOMAINS.includes(domain)) {
    throw badRequest('Access restricted to organization members only. Please use your company email.', 403);
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
  const { current_password, new_password } = parseOrThrow(
    changePasswordSchema, body, 'New password must be at least 6 characters'
  );
  return { current_password, new_password };
}

export interface ForgotPasswordInput {
  email: string;
}
const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1),
});

export function toForgotPasswordInput(body: unknown): ForgotPasswordInput {
  const { email } = parseOrThrow(forgotPasswordSchema, body, 'Email required');
  return { email };
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
  const { token, new_password } = parseOrThrow(
    resetPasswordSchema, body, 'Token and new password (min 6 characters) are required'
  );
  return { token, new_password };
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'lead' | 'employee';
  [key: string]: unknown;
}

// Strip password_hash before this reaches the JWT payload or the response body.
export function toLoginResponse(employee: Record<string, any>): UserSummary {
  const { password_hash, ...user } = employee;
  return user as UserSummary;
}
