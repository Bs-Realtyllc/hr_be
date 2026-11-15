import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const timeField = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be in HH:MM (24-hour) format');

const saveBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Company name is required'),
    email: z.string().trim().email('Invalid company email'),
    website: z.string().trim().min(1, 'Company website is required'),
    work_start: optionalNullable(timeField),
    work_end: optionalNullable(timeField),
    late_grace_minutes: optionalNullable(z.coerce.number().int().min(0).max(120)),
  })
  // Working hours are either fully configured or not set up at all — a lone
  // start or end time isn't meaningful on its own.
  .refine((b) => Boolean(b.work_start) === Boolean(b.work_end), {
    message: 'Both start and end time are required to set working hours',
    path: ['work_end'],
  });

export interface CompanySettingsSaveInput {
  name: string;
  email: string;
  website: string;
  workStart: string | null;
  workEnd: string | null;
  lateGraceMinutes: number | null;
}

export function toSaveInput(body: unknown): CompanySettingsSaveInput {
  const b = body as Record<string, unknown>;
  const parsed = bindAndValidate(saveBodySchema, {
    name: b?.name,
    email: b?.email,
    website: b?.website,
    work_start: b?.work_start,
    work_end: b?.work_end,
    late_grace_minutes: b?.late_grace_minutes,
  });

  return {
    name: parsed.name,
    email: parsed.email,
    website: parsed.website,
    workStart: parsed.work_start || null,
    workEnd: parsed.work_end || null,
    lateGraceMinutes: parsed.late_grace_minutes ?? 15,
  };
}
