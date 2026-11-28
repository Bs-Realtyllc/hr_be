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
  roadmap_key: z.string().trim().max(50),
  roadmap_label: z.string().trim().max(100),
  public_link: z.string().trim().url(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,10}$/, 'code must be 2-10 uppercase letters/digits'),
};

const createBodySchema = z.object({
  name: projectFields.name,
  description: optionalNullable(projectFields.description),
  repo_url: optionalNullable(projectFields.repo_url),
  docs_url: optionalNullable(projectFields.docs_url),
  status: optionalNullable(projectFields.status),
  start_date: optionalNullable(projectFields.start_date),
  expected_end_date: optionalNullable(projectFields.expected_end_date),
  roadmap_key: optionalNullable(projectFields.roadmap_key),
  roadmap_label: optionalNullable(projectFields.roadmap_label),
  public_link: optionalNullable(projectFields.public_link),
  code: optionalNullable(projectFields.code),
});

const updateBodySchema = z.object({
  name: optionalNullable(projectFields.name),
  description: optionalNullable(projectFields.description),
  repo_url: optionalNullable(projectFields.repo_url),
  docs_url: optionalNullable(projectFields.docs_url),
  status: optionalNullable(projectFields.status),
  start_date: optionalNullable(projectFields.start_date),
  expected_end_date: optionalNullable(projectFields.expected_end_date),
  roadmap_key: optionalNullable(projectFields.roadmap_key),
  roadmap_label: optionalNullable(projectFields.roadmap_label),
  public_link: optionalNullable(projectFields.public_link),
});
const UPDATE_FIELD_NAMES = Object.keys(updateBodySchema.shape) as (keyof ProjectUpdateInput & string)[];

export interface ProjectCreateInput {
  name: string;
  description: string | null;
  repo_url: string | null;
  docs_url: string | null;
  status: (typeof STATUSES)[number];
  start_date: string | null;
  expected_end_date: string | null;
  roadmap_key: string | null;
  roadmap_label: string | null;
  public_link: string | null;
  code?: string | null;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string | null;
  repo_url?: string | null;
  docs_url?: string | null;
  status?: (typeof STATUSES)[number];
  start_date?: string | null;
  expected_end_date?: string | null;
  roadmap_key?: string | null;
  roadmap_label?: string | null;
  public_link?: string | null;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string | null;
  repo_url: string[];
  docs_url: string[];
  status: string | null;
  roadmap_key: string | null;
  roadmap_label: string | null;
  public_link: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  created_at: Date;
  assigned_role?: string;
  modules?: unknown[];
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
    roadmap_key: parsed.roadmap_key ?? null,
    roadmap_label: parsed.roadmap_label ?? null,
    public_link: parsed.public_link ?? null,
    code: parsed.code ?? null,
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
    roadmap_key: project.roadmap_key ?? null,
    roadmap_label: project.roadmap_label ?? null,
    public_link: project.public_link ?? null,
    start_date: project.start_date,
    expected_end_date: project.expected_end_date,
    created_at: project.created_at,
    ...(project.assigned_role !== undefined && { assigned_role: project.assigned_role }),
    ...(project.modules !== undefined && { modules: project.modules }),
  };
}

export function toResponseList(projectRows: Record<string, any>[]): ProjectResponse[] {
  return projectRows.map((p) => toResponse(p) as ProjectResponse);
}

// Permission tier, not a job-function label — enforced in project.service.ts's
// assertProjectAdmin and issue.service.ts's assertCanWrite. Named admin/member/
// viewer rather than lead/contributor/viewer: this app's global employee role
// enum already has 'lead' with real company-wide power (leave approval,
// payroll, performance reviews), so reusing it here would make a project-level
// tier look like it grants those same powers. Matches how Jira/Plane name
// project-level tiers too.
export const ASSIGNMENT_ROLES = ['admin', 'member', 'viewer'] as const;
const assignmentBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  role: z.enum(ASSIGNMENT_ROLES).optional(),
});
export interface AssignmentInput {
  employee_id: number;
  role?: (typeof ASSIGNMENT_ROLES)[number];
}
export function toAssignmentInput(body: unknown): AssignmentInput {
  return bindAndValidate(assignmentBodySchema, body);
}

const MODULE_STATUSES = ['backlog', 'planned', 'in_progress', 'completed', 'cancelled'] as const;
const createModuleBodySchema = z.object({
  name: z.string().trim().min(1),
  description: optionalNullable(z.string()),
  start_date: optionalNullable(dateString),
  target_date: dateString,
  status: optionalNullable(z.enum(MODULE_STATUSES)),
  lead_id: optionalNullable(z.coerce.number().int().positive()),
});
export interface ModuleCreateInput {
  name: string;
  description?: string | null;
  start_date?: string | null;
  target_date: string;
  status?: (typeof MODULE_STATUSES)[number] | null;
  lead_id?: number | null;
}
export function toModuleCreateInput(body: unknown): ModuleCreateInput {
  return bindAndValidate(createModuleBodySchema, body);
}

const updateModuleBodySchema = z.object({
  name: optionalNullable(z.string().trim().min(1)),
  description: optionalNullable(z.string()),
  start_date: optionalNullable(dateString),
  target_date: optionalNullable(dateString),
  status: optionalNullable(z.enum(MODULE_STATUSES)),
  lead_id: optionalNullable(z.coerce.number().int().positive()),
});
export interface ModuleUpdateInput {
  name?: string | null;
  description?: string | null;
  start_date?: string | null;
  target_date?: string | null;
  status?: (typeof MODULE_STATUSES)[number] | null;
  lead_id?: number | null;
}
export function toModuleUpdateInput(body: unknown): ModuleUpdateInput {
  return bindAndValidate(updateModuleBodySchema, body);
}

const moduleMemberBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
});
export interface ModuleMemberInput {
  employee_id: number;
}
export function toModuleMemberInput(body: unknown): ModuleMemberInput {
  return bindAndValidate(moduleMemberBodySchema, body);
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
