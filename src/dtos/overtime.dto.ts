import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';
import { nepalDateString } from '../pkg/timezone';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Work date is required');
const requestType = z.enum(['planned', 'worked']);

// 'planned' is pre-approval for work that hasn't happened yet — always
// manual (no shift can exist for a future date), date must be today or
// later. 'worked' is retroactive — always built from one or more real
// clock sessions the employee already recorded; there's no manual
// fallback, since every worked hour is already tracked by the Tracker.
const createBodySchema = z
  .object({
    project_id: optionalNullable(z.coerce.number().int().positive()),
    request_type: requestType,
    clock_ids: optionalNullable(z.array(z.coerce.number().int().positive())),
    work_date: optionalNullable(dateString),
    hours: optionalNullable(z.coerce.number().gt(0, 'Hours must be between 0 and 16').lte(16, 'Hours must be between 0 and 16')),
    reason: z.string().trim().min(1, 'A reason for the overtime is required'),
  })
  .superRefine((b, ctx) => {
    const today = nepalDateString();
    if (b.request_type === 'planned') {
      if (!b.work_date) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['work_date'], message: 'Work date is required' });
      } else if (b.work_date < today) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['work_date'], message: 'A planned request must be for today or a future date' });
      }
      if (!b.hours) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hours'], message: 'Estimated hours are required' });
      }
    } else if (!b.clock_ids || b.clock_ids.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['clock_ids'], message: 'Select at least one clock session' });
    }
  });

// Only 'planned' requests are ever edited — a 'worked' request's date/hours
// are always derived from its linked sessions, so editing is cancel-and-
// resubmit instead.
const updateBodySchema = z.object({
  project_id: optionalNullable(z.coerce.number().int().positive()),
  work_date: dateString,
  hours: z.coerce.number().gt(0, 'Hours must be between 0 and 16').lte(16, 'Hours must be between 0 and 16'),
  reason: z.string().trim().min(1, 'A reason for the overtime is required'),
}).superRefine((b, ctx) => {
  const today = nepalDateString();
  if (b.work_date < today) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['work_date'], message: 'A planned request must be for today or a future date' });
  }
});

export interface OvertimeCreateInput {
  employee_id: number;
  project_id: number | null;
  request_type: 'planned' | 'worked';
  clock_ids: number[] | null;
  work_date: string | null;
  hours: number | null;
  reason: string;
}

export interface OvertimeUpdateInput {
  project_id: number | null;
  work_date: string;
  hours: number;
  reason: string;
}

export interface OvertimeSessionDetail {
  clock_id: number;
  clock_date: string;
  clock_in: Date;
  clock_out: Date | null;
  clock_out_estimated: boolean;
}

export interface OvertimeResponse {
  id: number;
  employee_id: number;
  employee_name?: string;
  designation?: string | null;
  project_id: number | null;
  project_name?: string | null;
  request_type: 'planned' | 'worked';
  session_count: number;
  sessions: OvertimeSessionDetail[];
  work_date: string;
  hours: string;
  reason: string;
  status: string | null;
  reviewed_by: number | null;
  reviewer_name?: string | null;
  reviewed_at: Date | null;
  approved_despite_mismatch: boolean;
  actual_hours: string | null;
  reconciled_at: Date | null;
  reconciled_by: number | null;
  reconciler_name?: string | null;
  hourly_rate: string | null;
  overtime_rate: string | null;
  amount: string | null;
  created_at: Date;
  clocked_seconds: number | null;
  hours_mismatch: boolean | null;
  clocked_seconds_estimated: boolean;
  needs_reconciliation: boolean;
}

// employeeId comes from the authenticated session, never the request body —
// otherwise anyone could submit (and have approved) an overtime claim
// attributed to a different employee.
export function toCreateInput(body: unknown, employeeId: number): OvertimeCreateInput {
  const parsed = bindAndValidate(createBodySchema, body);
  return {
    employee_id: employeeId,
    project_id: parsed.project_id || null,
    request_type: parsed.request_type,
    clock_ids: parsed.clock_ids?.length ? parsed.clock_ids : null,
    work_date: parsed.work_date || null,
    hours: parsed.hours || null,
    reason: parsed.reason,
  };
}

export function toUpdateInput(body: unknown): OvertimeUpdateInput {
  const parsed = bindAndValidate(updateBodySchema, body);
  return {
    project_id: parsed.project_id || null,
    work_date: parsed.work_date,
    hours: parsed.hours,
    reason: parsed.reason,
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
    request_type: ot.request_type,
    session_count: ot.session_count ?? 0,
    sessions: ot.sessions ?? [],
    work_date: ot.work_date,
    hours: ot.hours,
    reason: ot.reason,
    status: ot.status,
    reviewed_by: ot.reviewed_by,
    reviewer_name: ot.reviewer_name,
    reviewed_at: ot.reviewed_at,
    approved_despite_mismatch: Boolean(ot.approved_despite_mismatch),
    actual_hours: ot.actual_hours ?? null,
    reconciled_at: ot.reconciled_at ?? null,
    reconciled_by: ot.reconciled_by ?? null,
    reconciler_name: ot.reconciler_name ?? null,
    hourly_rate: ot.hourly_rate,
    overtime_rate: ot.overtime_rate,
    amount: ot.amount,
    created_at: ot.created_at,
    clocked_seconds: ot.clocked_seconds ?? null,
    hours_mismatch: ot.hours_mismatch ?? null,
    clocked_seconds_estimated: Boolean(ot.clocked_seconds_estimated),
    needs_reconciliation: Boolean(ot.needs_reconciliation),
  };
}

export function toResponseList(rows: Record<string, any>[]): OvertimeResponse[] {
  return rows.map((r) => toResponse(r) as OvertimeResponse);
}
