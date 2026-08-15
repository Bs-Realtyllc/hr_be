import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const createBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  notes: optionalNullable(z.string()),
});

export interface MonthlyReportCreateInput {
  employee_id: number;
  title: string;
  month: number;
  year: number;
  notes: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
}

export function toCreateInput(body: unknown, file: Express.Multer.File): MonthlyReportCreateInput {
  const b = body as Record<string, any>;
  if (!b?.employee_id || !b?.title || !b?.month || !b?.year) {
    throw new AppError('employee_id, title, month and year are required', 400);
  }

  const parsed = bindAndValidate(createBodySchema, { ...b, notes: b.notes || null });

  return {
    employee_id: parsed.employee_id,
    title: parsed.title,
    month: parsed.month,
    year: parsed.year,
    notes: parsed.notes ?? null,
    file_name: file.originalname,
    file_path: file.path,
    file_size: file.size,
  };
}

// What findWithEmployeeNames returns.
export interface MonthlyReportResponse {
  id: number;
  employee_id: number;
  employee_name: string;
  designation: string | null;
  department: string | null;
  title: string;
  month: number;
  year: number;
  file_name: string;
  file_size: number | null;
  notes: string | null;
  submitted_at: Date;
}
