import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

// The old dtos/standupDto.js did no validation at all — just passed body
// fields through as-is. Added here for consistency with every other
// converted domain; this is a behavior addition (previously-missing input
// validation), not a mechanical port, called out for visibility.
const createBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  yesterday: z.string().trim().min(1, 'yesterday is required'),
  today: z.string().trim().min(1, 'today is required'),
  blockers: optionalNullable(z.string().trim()),
  standup_date: optionalNullable(dateString), // defaults to today's date in the repository if omitted
});

export interface StandupCreateInput {
  employee_id: number;
  yesterday: string;
  today: string;
  blockers?: string | null;
  standup_date?: string | null;
}

// What findWithNames/findToday return.
export interface StandupResponse {
  id: number;
  employee_id: number;
  employee_name: string;
  designation: string | null;
  profile_picture: string | null;
  yesterday: string | null;
  today: string | null;
  blockers: string | null;
  standup_date: string;
  created_at: Date;
}

export function toCreateInput(body: unknown): StandupCreateInput {
  return bindAndValidate(createBodySchema, body);
}

export function toResponse(standup: Record<string, any> | null): StandupResponse | null {
  if (!standup) return null;
  return {
    id: standup.id,
    employee_id: standup.employee_id,
    employee_name: standup.employee_name,
    designation: standup.designation,
    profile_picture: standup.profile_picture,
    yesterday: standup.yesterday,
    today: standup.today,
    blockers: standup.blockers,
    standup_date: standup.standup_date,
    created_at: standup.created_at,
  };
}

export function toResponseList(standups: Record<string, any>[]): StandupResponse[] {
  return standups.map((s) => toResponse(s) as StandupResponse);
}
