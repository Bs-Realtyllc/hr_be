import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const createBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'holiday_date must be in YYYY-MM-DD format'),
  year: optionalNullable(z.coerce.number().int()),
  message: optionalNullable(z.string()),
});

export interface HolidayCreateInput {
  name: string;
  holiday_date: string;
  year: number;
  message: string | null;
}

// What findAll/findByYear return — holidays columns minus the new
// updated_at/created_by/updated_by audit columns, kept internal, same as
// every other converted domain.
export interface HolidayResponse {
  id: number;
  name: string;
  message: string | null;
  holiday_date: string;
  year: number;
  created_at: Date;
}

export function toCreateInput(body: unknown): HolidayCreateInput {
  const b = body as Record<string, any>;
  const parsed = bindAndValidate(createBodySchema, {
    ...b,
    // year defaults from holiday_date if omitted — same as the original.
    year: b?.year || (b?.holiday_date ? new Date(b.holiday_date).getFullYear() : undefined),
  });
  return {
    name: parsed.name,
    holiday_date: parsed.holiday_date,
    year: parsed.year as number,
    message: parsed.message || null,
  };
}

export function toResponse(holiday: Record<string, any> | null): HolidayResponse | null {
  if (!holiday) return null;
  return {
    id: holiday.id,
    name: holiday.name,
    message: holiday.message,
    holiday_date: holiday.holiday_date,
    year: holiday.year,
    created_at: holiday.created_at,
  };
}

export function toResponseList(rows: Record<string, any>[]): HolidayResponse[] {
  return rows.map((r) => toResponse(r) as HolidayResponse);
}
