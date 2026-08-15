import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

// YYYY-MM-DD, as sent by the date inputs on the frontend and expected by MySQL DATE columns.
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Work date is required');

// Fields shared by create and update — matches the DB's NOT NULL columns
// (work_date, hours, reason, approved_by_name). employee_id/project_id are
// handled separately since update never touches employee_id.
const commonFields = {
  work_date: dateString,
  hours: z.coerce.number().gt(0, 'Hours must be between 0 and 16').lte(16, 'Hours must be between 0 and 16'),
  reason: z.string().trim().min(1, 'A reason for the overtime is required'),
  approved_by_name: z.string().trim().min(1, 'Please specify who approved this overtime'),
};

const createBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  project_id: optionalNullable(z.coerce.number().int().positive()),
  ...commonFields,
});

const updateBodySchema = z.object({
  project_id: optionalNullable(z.coerce.number().int().positive()),
  ...commonFields,
});

export interface OvertimeCreateInput {
  employee_id: number;
  project_id: number | null;
  work_date: string;
  hours: number;
  reason: string;
  approved_by_name: string;
}

export interface OvertimeUpdateInput {
  project_id: number | null;
  work_date: string;
  hours: number;
  reason: string;
  approved_by_name: string;
}

// What findWithNames returns — overtime_requests columns (minus the new
// updated_at/created_by/updated_by audit columns, kept internal, same as
// every other converted domain) plus the joined names.
export interface OvertimeResponse {
  id: number;
  employee_id: number;
  employee_name?: string;
  designation?: string | null;
  project_id: number | null;
  project_name?: string | null;
  work_date: string;
  hours: string;
  reason: string;
  approved_by_name: string;
  status: string | null;
  reviewed_by: number | null;
  reviewer_name?: string | null;
  reviewed_at: Date | null;
  hourly_rate: string | null;
  overtime_rate: string | null;
  amount: string | null;
  created_at: Date;
}

export function toCreateInput(body: unknown): OvertimeCreateInput {
  const parsed = bindAndValidate(createBodySchema, body);
  return {
    employee_id: parsed.employee_id,
    project_id: parsed.project_id || null,
    work_date: parsed.work_date,
    hours: parsed.hours,
    reason: parsed.reason,
    approved_by_name: parsed.approved_by_name,
  };
}

export function toUpdateInput(body: unknown): OvertimeUpdateInput {
  const parsed = bindAndValidate(updateBodySchema, body);
  return {
    project_id: parsed.project_id || null,
    work_date: parsed.work_date,
    hours: parsed.hours,
    reason: parsed.reason,
    approved_by_name: parsed.approved_by_name,
  };
}

export function toResponse(ot: Record<string, any> | null): OvertimeResponse | null {
  if (!ot) return null;
  return {
    id: ot.id,
    employee_id: ot.employee_id,
    employee_name: ot.employee_name,
    designation: ot.designation,
    project_id: ot.project_id,
    project_name: ot.project_name,
    work_date: ot.work_date,
    hours: ot.hours,
    reason: ot.reason,
    approved_by_name: ot.approved_by_name,
    status: ot.status,
    reviewed_by: ot.reviewed_by,
    reviewer_name: ot.reviewer_name,
    reviewed_at: ot.reviewed_at,
    hourly_rate: ot.hourly_rate,
    overtime_rate: ot.overtime_rate,
    amount: ot.amount,
    created_at: ot.created_at,
  };
}

export function toResponseList(rows: Record<string, any>[]): OvertimeResponse[] {
  return rows.map((r) => toResponse(r) as OvertimeResponse);
}
