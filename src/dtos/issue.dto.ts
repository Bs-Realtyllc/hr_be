import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const STATUSES = ['backlog', 'todo', 'in_progress', 'done', 'cancelled'] as const;
const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'] as const;
const TYPES = ['epic', 'story', 'task', 'bug', 'subtask'] as const;
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

const issueFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string(),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  type: z.enum(TYPES),
  parent_issue_id: z.coerce.number().int().positive(),
  story_points: z.coerce.number().nonnegative(),
  assignee_id: z.coerce.number().int().positive(),
  module_id: z.coerce.number().int().positive(),
  due_date: dateString,
  start_date: dateString,
  label_ids: z.array(z.coerce.number().int().positive()),
  sort_order: z.coerce.number().int(),
};

const createBodySchema = z.object({
  title: issueFields.title,
  description: optionalNullable(issueFields.description),
  status: optionalNullable(issueFields.status),
  priority: optionalNullable(issueFields.priority),
  type: optionalNullable(issueFields.type),
  parent_issue_id: optionalNullable(issueFields.parent_issue_id),
  story_points: optionalNullable(issueFields.story_points),
  assignee_id: optionalNullable(issueFields.assignee_id),
  module_id: optionalNullable(issueFields.module_id),
  due_date: optionalNullable(issueFields.due_date),
  start_date: optionalNullable(issueFields.start_date),
  label_ids: optionalNullable(issueFields.label_ids),
});

const updateBodySchema = z.object({
  title: optionalNullable(issueFields.title),
  description: optionalNullable(issueFields.description),
  status: optionalNullable(issueFields.status),
  priority: optionalNullable(issueFields.priority),
  type: optionalNullable(issueFields.type),
  parent_issue_id: optionalNullable(issueFields.parent_issue_id),
  story_points: optionalNullable(issueFields.story_points),
  assignee_id: optionalNullable(issueFields.assignee_id),
  module_id: optionalNullable(issueFields.module_id),
  due_date: optionalNullable(issueFields.due_date),
  start_date: optionalNullable(issueFields.start_date),
  label_ids: optionalNullable(issueFields.label_ids),
  sort_order: optionalNullable(issueFields.sort_order),
});
const UPDATE_FIELD_NAMES = Object.keys(updateBodySchema.shape) as (keyof IssueUpdateInput & string)[];

export interface IssueCreateInput {
  title: string;
  description?: string | null;
  status?: (typeof STATUSES)[number] | null;
  priority?: (typeof PRIORITIES)[number] | null;
  type?: (typeof TYPES)[number] | null;
  parent_issue_id?: number | null;
  story_points?: number | null;
  assignee_id?: number | null;
  module_id?: number | null;
  due_date?: string | null;
  start_date?: string | null;
  label_ids?: number[] | null;
}

export interface IssueUpdateInput {
  title?: string;
  description?: string | null;
  status?: (typeof STATUSES)[number];
  priority?: (typeof PRIORITIES)[number];
  type?: (typeof TYPES)[number];
  parent_issue_id?: number | null;
  story_points?: number | null;
  assignee_id?: number | null;
  module_id?: number | null;
  due_date?: string | null;
  start_date?: string | null;
  label_ids?: number[] | null;
  sort_order?: number;
}

export function toCreateInput(body: unknown): IssueCreateInput {
  return bindAndValidate(createBodySchema, body);
}

export function toUpdateInput(body: unknown): IssueUpdateInput {
  const parsed = bindAndValidate(updateBodySchema, body);
  const b = body as Record<string, any>;
  const updates: IssueUpdateInput = {};
  UPDATE_FIELD_NAMES.forEach((f) => {
    if (b[f] === undefined) return;
    (updates as any)[f] = (parsed as any)[f];
  });
  return updates;
}

export interface IssueResponse {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string;
  parent_issue_id: number | null;
  story_points: number | null;
  sequence_number: number;
  issue_key: string;
  assignee_id: number | null;
  assignee_name: string | null;
  module_id: number | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: Date | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  labels: { id: number; name: string; color: string }[];
  sub_issues_count: number;
  attachment_count: number;
  link_count: number;
}

export function toResponse(row: Record<string, any>): IssueResponse {
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    type: row.type,
    parent_issue_id: row.parent_issue_id,
    story_points: row.story_points,
    sequence_number: row.sequence_number,
    issue_key: row.issue_key,
    assignee_id: row.assignee_id,
    assignee_name: row.assignee_name,
    module_id: row.module_id,
    due_date: row.due_date,
    start_date: row.start_date,
    completed_at: row.completed_at,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    labels: row.labels ?? [],
    sub_issues_count: row.sub_issues_count ?? 0,
    attachment_count: row.attachment_count ?? 0,
    link_count: row.link_count ?? 0,
  };
}

export function toResponseList(rows: Record<string, any>[]): IssueResponse[] {
  return rows.map(toResponse);
}

const commentBodySchema = z.object({
  body: z.string().trim().min(1),
  mentioned_employee_ids: optionalNullable(z.array(z.coerce.number().int().positive())),
});
export interface CommentInput {
  body: string;
  mentioned_employee_ids?: number[] | null;
}
export function toCommentInput(body: unknown): CommentInput {
  return bindAndValidate(commentBodySchema, body, 'comment body is required');
}

const labelBodySchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a hex value like #6b7280').optional(),
});
export interface LabelInput {
  name: string;
  color?: string;
}
export function toLabelInput(body: unknown): LabelInput {
  return bindAndValidate(labelBodySchema, body, 'label name is required');
}

const LINK_TYPES = ['blocks', 'relates_to', 'duplicates'] as const;
const linkBodySchema = z.object({
  linked_issue_id: z.coerce.number().int().positive(),
  link_type: z.enum(LINK_TYPES),
});
export interface LinkInput {
  linked_issue_id: number;
  link_type: (typeof LINK_TYPES)[number];
}
export function toLinkInput(body: unknown): LinkInput {
  return bindAndValidate(linkBodySchema, body, 'linked_issue_id and a valid link_type are required');
}

export interface AttachmentResponse {
  id: number;
  issue_id: number;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  created_at: Date;
}
