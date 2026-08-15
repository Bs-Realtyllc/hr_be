import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate, optionalNullable } from '../pkg/validation';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getWeekStartDate } = require('../pkg/weekUtil');

const createBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1),
  notes: optionalNullable(z.string()),
});

export interface WeeklyReportCreateInput {
  employee_id: number;
  title: string;
  notes: string | null;
  week_start_date: string;
  file_name: string;
  file_path: string;
  file_size: number;
}

export function toCreateInput(body: unknown, file: Express.Multer.File): WeeklyReportCreateInput {
  const b = body as Record<string, any>;
  if (!b?.employee_id || !b?.title) {
    throw new AppError('employee_id and title are required', 400);
  }

  const parsed = bindAndValidate(createBodySchema, { ...b, notes: b.notes || null });

  return {
    employee_id: parsed.employee_id,
    title: parsed.title,
    notes: parsed.notes ?? null,
    week_start_date: getWeekStartDate(),
    file_name: file.originalname,
    file_path: file.path,
    file_size: file.size,
  };
}

// What findWithEmployeeNames returns.
export interface WeeklyReportResponse {
  id: number;
  employee_id: number;
  employee_name: string;
  designation: string | null;
  department: string | null;
  title: string;
  week_start_date: string;
  file_name: string;
  file_size: number | null;
  notes: string | null;
  submitted_at: Date;
}
