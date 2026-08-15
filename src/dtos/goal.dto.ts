import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const CATEGORIES = ['individual', 'team', 'company'] as const;
const STATUSES = ['not_started', 'in_progress', 'at_risk', 'completed', 'missed'] as const;

const dateString = optionalNullable(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format'));

const createBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, 'title is required'),
  description: optionalNullable(z.string()),
  category: optionalNullable(z.enum(CATEGORIES)),
  metric_unit: optionalNullable(z.string().trim().min(1)),
  target_value: optionalNullable(z.coerce.number()),
  current_value: optionalNullable(z.coerce.number()),
  weight: optionalNullable(z.coerce.number()),
  status: optionalNullable(z.enum(STATUSES)),
  start_date: dateString,
  due_date: dateString,
});

export interface GoalCreateInput {
  employee_id: number;
  title: string;
  description: string | null;
  category: (typeof CATEGORIES)[number];
  metric_unit: string;
  target_value: number;
  current_value: number;
  weight: number;
  status: (typeof STATUSES)[number];
  start_date: string | null;
  due_date: string | null;
  created_by: number | null;
}

export function toCreateInput(body: unknown, createdBy: number | null): GoalCreateInput {
  const parsed = bindAndValidate(createBodySchema, body);
  return {
    employee_id: parsed.employee_id,
    title: parsed.title,
    description: parsed.description ?? null,
    category: parsed.category || 'individual',
    metric_unit: parsed.metric_unit || '%',
    target_value: parsed.target_value ?? 100,
    current_value: parsed.current_value ?? 0,
    weight: parsed.weight ?? 3,
    status: parsed.status || 'not_started',
    start_date: parsed.start_date ?? null,
    due_date: parsed.due_date ?? null,
    created_by: createdBy,
  };
}

const updateBodySchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  description: optionalNullable(z.string()),
  category: optionalNullable(z.enum(CATEGORIES)),
  metric_unit: optionalNullable(z.string().trim().min(1)),
  target_value: optionalNullable(z.coerce.number()),
  weight: optionalNullable(z.coerce.number()),
  start_date: dateString,
  due_date: dateString,
});

export interface GoalUpdateInput {
  title: string;
  description: string | null;
  category: (typeof CATEGORIES)[number];
  metric_unit: string;
  target_value: number;
  weight: number;
  start_date: string | null;
  due_date: string | null;
}

export function toUpdateInput(body: unknown): GoalUpdateInput {
  const parsed = bindAndValidate(updateBodySchema, body);
  return {
    title: parsed.title,
    description: parsed.description ?? null,
    category: parsed.category || 'individual',
    metric_unit: parsed.metric_unit || '%',
    target_value: parsed.target_value ?? 100,
    weight: parsed.weight ?? 3,
    start_date: parsed.start_date ?? null,
    due_date: parsed.due_date ?? null,
  };
}

const progressBodySchema = z.object({
  current_value: optionalNullable(z.coerce.number()),
  status: optionalNullable(z.enum(STATUSES)),
});

export interface GoalProgressInput {
  current_value: number;
  status: (typeof STATUSES)[number];
}

export function toProgressInput(body: unknown): GoalProgressInput {
  const parsed = bindAndValidate(progressBodySchema, body);
  return {
    current_value: parsed.current_value ?? 0,
    status: parsed.status || 'in_progress',
  };
}
