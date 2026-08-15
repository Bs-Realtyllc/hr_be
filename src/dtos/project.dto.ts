import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const STATUSES = ['active', 'archived', 'on_hold'] as const;
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

const urlListField = z.union([z.string(), z.array(z.string())]);

const projectFields = {
  name: z.string().trim().min(1),
  description: z.string(),
  repo_url: urlListField,
  docs_url: urlListField,
  status: z.enum(STATUSES),
  start_date: dateString,
  expected_end_date: dateString,
};

const createBodySchema = z.object({
  name: projectFields.name,
  description: optionalNullable(projectFields.description),
  repo_url: optionalNullable(projectFields.repo_url),
  docs_url: optionalNullable(projectFields.docs_url),
  status: optionalNullable(projectFields.status),
  start_date: optionalNullable(projectFields.start_date),
  expected_end_date: optionalNullable(projectFields.expected_end_date),
});

const updateBodySchema = z.object({
  name: optionalNullable(projectFields.name),
  description: optionalNullable(projectFields.description),
  repo_url: optionalNullable(projectFields.repo_url),
  docs_url: optionalNullable(projectFields.docs_url),
  status: optionalNullable(projectFields.status),
  start_date: optionalNullable(projectFields.start_date),
  expected_end_date: optionalNullable(projectFields.expected_end_date),
});
const UPDATE_FIELD_NAMES = Object.keys(updateBodySchema.shape) as (keyof ProjectUpdateInput)[];

export interface ProjectCreateInput {
  name: string;
  description: string | null;
  repo_url: string | null;
  docs_url: string | null;
  status: (typeof STATUSES)[number];
  start_date: string | null;
  expected_end_date: string | null;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string | null;
  repo_url?: string | null;
  docs_url?: string | null;
  status?: (typeof STATUSES)[number];
  start_date?: string | null;
  expected_end_date?: string | null;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string | null;
  repo_url: string[];
  docs_url: string[];
  status: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  created_at: Date;
  assigned_role?: string;
  milestones?: unknown[];
}

function toArr(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const p = JSON.parse(v as string);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function toJSON(v: unknown): string | null {
  if (!v) return null;
  const arr = Array.isArray(v) ? v : [v];
  const clean = arr.map((s) => String(s).trim()).filter(Boolean);
  return clean.length ? JSON.stringify(clean) : null;
}

export function toCreateInput(body: unknown): ProjectCreateInput {
  const parsed = bindAndValidate(createBodySchema, body);
  return {
    name: parsed.name,
    description: parsed.description ?? null,
    repo_url: toJSON(parsed.repo_url),
    docs_url: toJSON(parsed.docs_url),
    status: parsed.status || 'active',
    start_date: parsed.start_date || null,
    expected_end_date: parsed.expected_end_date || null,
  };
}

export function toUpdateInput(body: unknown): ProjectUpdateInput {
  const parsed = bindAndValidate(updateBodySchema, body);
  const b = body as Record<string, any>;
  const updates: ProjectUpdateInput = {};
  UPDATE_FIELD_NAMES.forEach((f) => {
    if (b[f] === undefined) return;
    if (f === 'repo_url' || f === 'docs_url') {
      (updates as any)[f] = toJSON((parsed as any)[f]);
    } else {
      (updates as any)[f] = (parsed as any)[f];
    }
  });
  return updates;
}

export function toResponse(project: Record<string, any> | null): ProjectResponse | null {
  if (!project) return null;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    repo_url: toArr(project.repo_url),
    docs_url: toArr(project.docs_url),
    status: project.status,
    start_date: project.start_date,
    expected_end_date: project.expected_end_date,
    created_at: project.created_at,
    ...(project.assigned_role !== undefined && { assigned_role: project.assigned_role }),
    ...(project.milestones !== undefined && { milestones: project.milestones }),
  };
}

export function toResponseList(projectRows: Record<string, any>[]): ProjectResponse[] {
  return projectRows.map((p) => toResponse(p) as ProjectResponse);
}

const ASSIGNMENT_ROLES = ['lead', 'backend', 'frontend', 'ui_ux', 'qa', 'devops'] as const;
const assignmentBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  role: z.enum(ASSIGNMENT_ROLES),
});
export interface AssignmentInput {
  employee_id: number;
  role: (typeof ASSIGNMENT_ROLES)[number];
}
export function toAssignmentInput(body: unknown): AssignmentInput {
  return bindAndValidate(assignmentBodySchema, body);
}

const MILESTONE_STATUSES = ['pending', 'in_progress', 'completed'] as const;
const createMilestoneBodySchema = z.object({
  title: z.string().trim().min(1),
  due_date: dateString,
  status: optionalNullable(z.enum(MILESTONE_STATUSES)),
});
export interface MilestoneCreateInput {
  title: string;
  due_date: string;
  status?: (typeof MILESTONE_STATUSES)[number] | null;
}
export function toMilestoneCreateInput(body: unknown): MilestoneCreateInput {
  return bindAndValidate(createMilestoneBodySchema, body);
}

const updateMilestoneBodySchema = z.object({
  title: optionalNullable(z.string().trim().min(1)),
  due_date: optionalNullable(dateString),
  status: optionalNullable(z.enum(MILESTONE_STATUSES)),
});
export interface MilestoneUpdateInput {
  title?: string | null;
  due_date?: string | null;
  status?: (typeof MILESTONE_STATUSES)[number] | null;
}
export function toMilestoneUpdateInput(body: unknown): MilestoneUpdateInput {
  return bindAndValidate(updateMilestoneBodySchema, body);
}

const serviceBodySchema = z.object({
  service_key: z.string().trim().min(1, 'service_key required'),
});
export interface ServiceInput {
  service_key: string;
}
export function toServiceInput(body: unknown): ServiceInput {
  return bindAndValidate(serviceBodySchema, body, 'service_key required');
}
