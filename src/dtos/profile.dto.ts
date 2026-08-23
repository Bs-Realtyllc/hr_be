import { z } from 'zod';
import AppError from '../pkg/AppError';

const SELF_SERVICE_FIELDS = ['dob', 'address'] as const;

const fieldSchemas = {
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be a date in YYYY-MM-DD format'),
  address: z.string(),
} as const;

export interface ProfileUpdateInput {
  dob?: string | null;
  address?: string | null;
}

export function toUpdateInput(body: unknown): ProfileUpdateInput {
  const b = body as Record<string, any>;
  const updates: ProfileUpdateInput = {};
  SELF_SERVICE_FIELDS.forEach((f) => {
    if (b[f] !== undefined) {
      const value = b[f] || null;
      if (value !== null) {
        const result = fieldSchemas[f].safeParse(value);
        if (!result.success) {
          throw new AppError(`${f}: ${result.error.issues[0].message}`, 400);
        }
      }
      (updates as any)[f] = value;
    }
  });
  return updates;
}
