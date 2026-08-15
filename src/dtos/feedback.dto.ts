import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const FEEDBACK_TYPES = ['praise', 'constructive', 'peer', 'manager'] as const;
const VISIBILITIES = ['public', 'private'] as const;

const createBodySchema = z.object({
  from_employee_id: z.coerce.number().int().positive(),
  to_employee_id: z.coerce.number().int().positive(),
  feedback_type: z.enum(FEEDBACK_TYPES),
  visibility: z.enum(VISIBILITIES),
  message: z.string().trim().min(1, 'Message is required'),
  project_id: optionalNullable(z.coerce.number().int().positive()),
});

export interface FeedbackCreateInput {
  from_employee_id: number;
  to_employee_id: number;
  feedback_type: (typeof FEEDBACK_TYPES)[number];
  visibility: (typeof VISIBILITIES)[number];
  message: string;
  project_id: number | null;
}

export function toCreateInput(body: unknown, fromEmployeeId: number): FeedbackCreateInput {
  const b = body as Record<string, any>;
  const parsed = bindAndValidate(createBodySchema, {
    from_employee_id: fromEmployeeId,
    to_employee_id: b?.to_employee_id,
    feedback_type: b?.feedback_type || 'praise',
    visibility: b?.visibility || 'public',
    message: b?.message,
    project_id: b?.project_id || null,
  });
  return { ...parsed, project_id: parsed.project_id ?? null };
}
