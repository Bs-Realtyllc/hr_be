import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const createBodySchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  rank: optionalNullable(z.coerce.number().int().positive()),
  department_id: z.coerce.number().int().positive(),
  reports_to_position_id: optionalNullable(z.coerce.number().int().positive()),
});

const updateBodySchema = z.object({
  title: z.string().trim().min(1, 'title is required').optional(),
  rank: optionalNullable(z.coerce.number().int().positive()),
  department_id: z.coerce.number().int().positive().optional(),
  reports_to_position_id: optionalNullable(z.coerce.number().int().positive()),
});

export interface PositionCreateInput {
  title: string;
  rank?: number | null;
  departmentId: number;
  reportsToPositionId?: number | null;
}

export interface PositionUpdateInput {
  title?: string;
  rank?: number | null;
  departmentId?: number;
  reportsToPositionId?: number | null;
}

export function toCreateInput(body: unknown): PositionCreateInput {
  const parsed = bindAndValidate(createBodySchema, body);
  return {
    title: parsed.title,
    rank: parsed.rank ?? null,
    departmentId: parsed.department_id,
    reportsToPositionId: parsed.reports_to_position_id ?? null,
  };
}

export function toUpdateInput(body: unknown): PositionUpdateInput {
  const parsed = bindAndValidate(updateBodySchema, body);
  const input: PositionUpdateInput = {};
  if (parsed.title !== undefined) input.title = parsed.title;
  if (parsed.rank !== undefined) input.rank = parsed.rank;
  if (parsed.department_id !== undefined) input.departmentId = parsed.department_id;
  if (parsed.reports_to_position_id !== undefined) input.reportsToPositionId = parsed.reports_to_position_id;
  return input;
}

export function toResponse(position: Record<string, any> | null) {
  if (!position) return null;
  return {
    id: position.id,
    title: position.title,
    rank: position.rank,
    department_id: position.department_id,
    department_name: position.department_name,
    reports_to_position_id: position.reports_to_position_id,
    reports_to_title: position.reports_to_title,
    incumbent_id: position.incumbent_id ?? null,
    incumbent_name: position.incumbent_name ?? null,
    is_active: position.is_active,
  };
}

export function toResponseList(positions: Record<string, any>[]) {
  return positions.map((p) => toResponse(p));
}
