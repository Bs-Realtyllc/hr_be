import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate } from '../pkg/validation';

const PAY_FREQUENCIES = ['monthly', 'biweekly', 'weekly'] as const;

const salarySchema = z.object({
  salary: z.coerce.number().nonnegative().nullable(),
  pay_frequency: z.enum(PAY_FREQUENCIES),
});

export interface UpdateSalaryInput {
  salary: number | null;
  pay_frequency: (typeof PAY_FREQUENCIES)[number];
}

export function toUpdateSalaryInput(body: unknown): UpdateSalaryInput {
  const b = body as Record<string, any>;
  const parsed = bindAndValidate(salarySchema, {
    salary: b?.salary ?? null,
    pay_frequency: b?.pay_frequency ?? 'monthly',
  });
  return { salary: parsed.salary ?? null, pay_frequency: parsed.pay_frequency };
}

export function validatePasswordReset(password: unknown): string {
  if (typeof password !== 'string' || password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }
  return password;
}

const taxProfileSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  amount: z.coerce.number().nonnegative().nullable(),
  tax_amount: z.coerce.number().nonnegative().nullable(),
  tax_perc: z.coerce.number().nonnegative().nullable(),
});

export interface TaxProfileInput {
  month: number;
  year: number;
  amount: number | null;
  tax_amount: number | null;
  tax_perc: number | null;
}

export function toTaxProfileInput(body: unknown): TaxProfileInput {
  const b = body as Record<string, any>;
  if (b?.month == null || b?.year == null) {
    throw new AppError('month and year are required', 400);
  }
  const parsed = bindAndValidate(taxProfileSchema, {
    month: b.month,
    year: b.year,
    amount: b?.amount ?? null,
    tax_amount: b?.tax_amount ?? null,
    tax_perc: b?.tax_perc ?? null,
  });
  return {
    month: parsed.month,
    year: parsed.year,
    amount: parsed.amount ?? null,
    tax_amount: parsed.tax_amount ?? null,
    tax_perc: parsed.tax_perc ?? null,
  };
}
