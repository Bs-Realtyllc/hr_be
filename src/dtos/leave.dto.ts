import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const LEAVE_TYPES = ['sick', 'bereavement', 'maternity', 'paternity'] as const;

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

const createBodySchema = z
  .object({
    employee_id: z.coerce.number().int().positive(),
    leave_type: z.enum(LEAVE_TYPES),
    start_date: dateString,
    end_date: dateString,
    reason: z.string().trim().min(1, 'reason is required'),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'end_date cannot be before start_date',
    path: ['end_date'],
  });

const updateBodySchema = z
  .object({
    leave_type: optionalNullable(z.enum(LEAVE_TYPES)),
    start_date: optionalNullable(dateString),
    end_date: optionalNullable(dateString),
    reason: optionalNullable(z.string().trim().min(1, 'reason is required')),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) return data.end_date >= data.start_date;
      return true;
    },
    { message: 'end_date cannot be before start_date', path: ['end_date'] }
  );

export interface LeaveCreateInput {
  employee_id: number;
  leave_type: (typeof LEAVE_TYPES)[number];
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveUpdateInput {
  leave_type?: (typeof LEAVE_TYPES)[number] | null;
  start_date?: string | null;
  end_date?: string | null;
  reason?: string | null;
}

export interface LeaveResponse {
  id: number;
  employee_id: number;
  employee_name?: string;
  designation?: string | null;
  department?: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  reviewer_name?: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

export function toCreateInput(body: unknown): LeaveCreateInput {
  return bindAndValidate(createBodySchema, body);
}

export function toUpdateInput(body: unknown): LeaveUpdateInput {
  return bindAndValidate(updateBodySchema, body);
}

export function toResponse(leave: Record<string, any> | null): LeaveResponse | null {
  if (!leave) return null;
  return {
    id: leave.id,
    employee_id: leave.employee_id,
    employee_name: leave.employee_name,
    designation: leave.designation,
    department: leave.department,
    leave_type: leave.leave_type,
    start_date: leave.start_date,
    end_date: leave.end_date,
    reason: leave.reason,
    status: leave.status,
    reviewer_name: leave.reviewer_name,
    reviewed_at: leave.reviewed_at,
    created_at: leave.created_at,
  };
}

export function toResponseList(leaves: Record<string, any>[]): LeaveResponse[] {
  return leaves.map((l) => toResponse(l) as LeaveResponse);
}

export interface LeaveCreateInputViaMail {
  from : string;
  leave_type: (typeof LEAVE_TYPES)[number];
  start_date: string;
  end_date: string;
  reason: string;
}
const createViaMailBodySchema = z
  .object({
    from: z.email(),
    leave_type: z.enum(LEAVE_TYPES),
    start_date: dateString,
    end_date: dateString,
    reason: z.string().trim().min(1, 'reason is required'),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'end_date cannot be before start_date',
    path: ['end_date'],
  });

export function toCreateInputViaMail(body: unknown): LeaveCreateInputViaMail {
  return bindAndValidate(createViaMailBodySchema, body);
}
