const { z } = require('zod');

// YYYY-MM-DD, as sent by the date inputs on the frontend and expected by MySQL DATE columns.
const dateString = z.string({ error: 'Work date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Work date is required');

// Fields shared by create and update — matches the DB's NOT NULL columns
// (work_date, hours, reason, approved_by_name). employee_id/project_id are
// handled separately since update never touches employee_id.
const commonFields = {
  work_date: dateString,
  hours: z.coerce.number({ error: 'Hours must be between 0 and 16' }).gt(0, 'Hours must be between 0 and 16').lte(16, 'Hours must be between 0 and 16'),
  reason: z.string().trim().min(1, 'A reason for the overtime is required'),
  approved_by_name: z.string().trim().min(1, 'Please specify who approved this overtime'),
};

const createSchema = z.object({
  employee_id: z.coerce.number({ error: 'employee_id is required' }).int().positive(),
  project_id: z.coerce.number().int().positive().nullable().optional(),
  ...commonFields,
});

const updateSchema = z.object({
  project_id: z.coerce.number().int().positive().nullable().optional(),
  ...commonFields,
});

// Returns an error message string if the submission fails validation, otherwise null —
// same contract as before, now backed by the schemas above instead of manual checks.
function firstError(schema, data) {
  const result = schema.safeParse(data);
  return result.success ? null : result.error.issues[0].message;
}

exports.toCreateInput = (body) => ({
  employee_id: body.employee_id,
  project_id: body.project_id || null,
  work_date: body.work_date,
  hours: body.hours,
  reason: body.reason,
  approved_by_name: body.approved_by_name,
});

exports.toUpdateInput = (body) => ({
  project_id: body.project_id || null,
  work_date: body.work_date,
  hours: body.hours,
  reason: body.reason,
  approved_by_name: body.approved_by_name,
});

exports.validateCreate = (data) => firstError(createSchema, data);
exports.validateUpdate = (data) => firstError(updateSchema, data);
