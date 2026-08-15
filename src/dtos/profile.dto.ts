import { z } from 'zod';
import AppError from '../pkg/AppError';

const SELF_SERVICE_FIELDS = ['phone', 'alt_phone', 'emergency_contact', 'dob', 'bio', 'address', 'timezone', 'work_hours'] as const;

// Free-text self-service fields — the employee edits their own profile, so these
// stay permissive (any string), except dob which must be a real calendar date
// since it drives the birthday-event logic in profile.service.ts.
const fieldSchemas = {
  phone: z.string(),
  alt_phone: z.string(),
  emergency_contact: z.string(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be a date in YYYY-MM-DD format'),
  bio: z.string(),
  address: z.string(),
  timezone: z.string(),
  work_hours: z.string(),
} as const;

export interface ProfileUpdateInput {
  phone?: string | null;
  alt_phone?: string | null;
  emergency_contact?: string | null;
  dob?: string | null;
  bio?: string | null;
  address?: string | null;
  timezone?: string | null;
  work_hours?: string | null;
  qualifications?: string;
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
  if (b.qualifications !== undefined) {
    updates.qualifications = JSON.stringify(b.qualifications);
  }
  return updates;
}
