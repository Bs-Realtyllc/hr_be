import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

// Matches the `leave_requests.leave_type` ENUM in schema.sql / migrate_leave_policy.sql —
// 'casual'/'annual' are retired for NEW requests (kept in the DB enum only so
// historical rows stay valid). NOTE: this fixes a pre-existing bug found while
// converting this domain — the old dtos/leaveDto.js's LEAVE_TYPES was
// `['casual', 'sick', 'annual']`, missing 'bereavement'/'maternity'/'paternity'
// and still allowing the two retired types, contradicting swagger.js's
// documented schema and migrate_leave_policy.sql's own stated intent ("the
// app no longer offers them for new requests — only the four new categories").
const LEAVE_TYPES = ['sick', 'bereavement', 'maternity', 'paternity'] as const;

// YYYY-MM-DD, as sent by the date inputs on the frontend and expected by MySQL DATE columns.
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

// Same shape as create, but every field is optional — only provided fields are validated/updated.
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

// What findWithNames/findWithEmployeeById return — leave_requests columns
// (minus the new updated_at/created_by/updated_by audit columns, kept
// internal — see instruction.md's BaseModel section) plus the two joined names.
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
