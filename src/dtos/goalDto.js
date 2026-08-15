const { z } = require('zod');

// Matches the `goals` table ENUMs in schema.sql.
const CATEGORIES = ['individual', 'team', 'company'];
const STATUSES = ['not_started', 'in_progress', 'at_risk', 'completed', 'missed'];

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format').nullable();

function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  return result.data;
}

const createSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().nullable(),
  category: z.enum(CATEGORIES),
  metric_unit: z.string().trim().min(1),
  target_value: z.coerce.number(),
  current_value: z.coerce.number(),
  weight: z.coerce.number(),
  status: z.enum(STATUSES),
  start_date: dateString,
  due_date: dateString,
  created_by: z.coerce.number().int().positive().nullable(),
});

exports.toCreateInput = (body, createdBy) => parseOrThrow(createSchema, {
  employee_id: body.employee_id,
  title: body.title,
  description: body.description || null,
  category: body.category || 'individual',
  metric_unit: body.metric_unit || '%',
  target_value: body.target_value ?? 100,
  current_value: body.current_value ?? 0,
  weight: body.weight ?? 3,
  status: body.status || 'not_started',
  start_date: body.start_date || null,
  due_date: body.due_date || null,
  created_by: createdBy,
});

const updateSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().nullable(),
  category: z.enum(CATEGORIES),
  metric_unit: z.string().trim().min(1),
  target_value: z.coerce.number(),
  weight: z.coerce.number(),
  start_date: dateString,
  due_date: dateString,
});

exports.toUpdateInput = (body) => parseOrThrow(updateSchema, {
  title: body.title,
  description: body.description || null,
  category: body.category || 'individual',
  metric_unit: body.metric_unit || '%',
  target_value: body.target_value ?? 100,
  weight: body.weight ?? 3,
  start_date: body.start_date || null,
  due_date: body.due_date || null,
});

const progressSchema = z.object({
  current_value: z.coerce.number(),
  status: z.enum(STATUSES),
});

exports.toProgressInput = (body) => parseOrThrow(progressSchema, {
  current_value: body.current_value ?? 0,
  status: body.status || 'in_progress',
});
