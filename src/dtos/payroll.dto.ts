import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate } from '../pkg/validation';

// Matches employees.pay_frequency ENUM in schema.sql.
const PAY_FREQUENCIES = ['monthly', 'biweekly', 'weekly'] as const;
// Matches employee_tax_profiles.filing_status / tax_regime ENUMs in schema.sql.
const FILING_STATUSES = ['single', 'married', 'head_of_household'] as const;
const TAX_REGIMES = ['old', 'new'] as const;

const salarySchema = z.object({
  salary: z.coerce.number().nonnegative().nullable(),
  pay_frequency: z.enum(PAY_FREQUENCIES),
});

export interface UpdateSalaryInput {
  salary: number | null;
  pay_frequency: (typeof PAY_FREQUENCIES)[number];
}

// Shapes the salary-update body into the (salary, pay_frequency) values expected
// by employee.repository.ts's updateSalary — mirrors the original controller's ?? defaulting.
export function toUpdateSalaryInput(body: unknown): UpdateSalaryInput {
  const b = body as Record<string, any>;
  const parsed = bindAndValidate(salarySchema, {
    salary: b?.salary ?? null,
    pay_frequency: b?.pay_frequency ?? 'monthly',
  });
  return { salary: parsed.salary ?? null, pay_frequency: parsed.pay_frequency };
}

// Throws AppError(400) if the password fails validation — same rule as before
// (min 6 chars), now via the shared validator instead of a manual check.
export function validatePasswordReset(password: unknown): string {
  if (typeof password !== 'string' || password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }
  return password;
}

const taxProfileSchema = z.object({
  tax_id: z.string().trim().nullable(),
  country: z.string().trim().min(1),
  filing_status: z.enum(FILING_STATUSES),
  tax_regime: z.enum(TAX_REGIMES),
  exemptions: z.coerce.number().nonnegative(),
  additional_withholding: z.coerce.number().nonnegative(),
  notes: z.string().trim().nullable(),
});

export interface TaxProfileInput {
  tax_id: string | null;
  country: string;
  filing_status: (typeof FILING_STATUSES)[number];
  tax_regime: (typeof TAX_REGIMES)[number];
  exemptions: number;
  additional_withholding: number;
  notes: string | null;
}

export function toTaxProfileInput(body: unknown): TaxProfileInput {
  const b = body as Record<string, any>;
  const parsed = bindAndValidate(taxProfileSchema, {
    tax_id: b?.tax_id || null,
    country: b?.country || 'Nepal',
    filing_status: b?.filing_status || 'single',
    tax_regime: b?.tax_regime || 'new',
    exemptions: b?.exemptions ?? 0,
    additional_withholding: b?.additional_withholding ?? 0,
    notes: b?.notes || null,
  });
  return {
    tax_id: parsed.tax_id ?? null,
    country: parsed.country,
    filing_status: parsed.filing_status,
    tax_regime: parsed.tax_regime,
    exemptions: parsed.exemptions,
    additional_withholding: parsed.additional_withholding,
    notes: parsed.notes ?? null,
  };
}
