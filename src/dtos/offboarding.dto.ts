import { z } from 'zod';
import { bindAndValidate } from '../pkg/validation';

const EXIT_TYPES = ['resignation', 'termination', 'end_of_contract', 'non_renewal'] as const;
const TASK_STATUSES = ['pending', 'completed', 'not_applicable'] as const;

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

const initiateBodySchema = z
  .object({
    employee_id: z.coerce.number().int().positive(),
    exit_type: z.enum(EXIT_TYPES),
    reason: z.string().trim().min(1).optional(),
    notice_date: dateString,
    last_working_day: dateString,
  })
  .refine((data) => data.last_working_day >= data.notice_date, {
    message: 'last_working_day cannot be before notice_date',
    path: ['last_working_day'],
  });

const updateTaskBodySchema = z.object({
  status: z.enum(TASK_STATUSES),
  notes: z.string().trim().optional(),
});

export interface OffboardingInitiateInput {
  employeeId: number;
  exitType: (typeof EXIT_TYPES)[number];
  reason?: string;
  noticeDate: string;
  lastWorkingDay: string;
}

export interface OffboardingTaskUpdateInput {
  status: (typeof TASK_STATUSES)[number];
  notes?: string;
}

export function toInitiateInput(body: unknown): OffboardingInitiateInput {
  const parsed = bindAndValidate(initiateBodySchema, body);
  return {
    employeeId: parsed.employee_id,
    exitType: parsed.exit_type,
    reason: parsed.reason,
    noticeDate: parsed.notice_date,
    lastWorkingDay: parsed.last_working_day,
  };
}

export function toTaskUpdateInput(body: unknown): OffboardingTaskUpdateInput {
  return bindAndValidate(updateTaskBodySchema, body);
}
