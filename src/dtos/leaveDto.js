const { z } = require('zod');

// Matches the `leave_requests.leave_type` ENUM in schema.sql.
const LEAVE_TYPES = ['casual', 'sick', 'annual'];

// YYYY-MM-DD, as sent by the date inputs on the frontend and expected by MySQL DATE columns.
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

const createSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  leave_type: z.enum(LEAVE_TYPES),
  start_date: dateString,
  end_date: dateString,
  reason: z.string().trim().min(1, 'reason is required'),
}).refine((data) => data.end_date >= data.start_date, {
  message: 'end_date cannot be before start_date',
  path: ['end_date'],
});

// Same shape as create, but every field is optional — only provided fields are validated/updated.
const updateSchema = z.object({
  leave_type: z.enum(LEAVE_TYPES).optional(),
  start_date: dateString.optional(),
  end_date: dateString.optional(),
  reason: z.string().trim().min(1, 'reason is required').optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) return data.end_date >= data.start_date;
  return true;
}, {
  message: 'end_date cannot be before start_date',
  path: ['end_date'],
});

function runValidation(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  return result.data;
}

exports.toCreateInput = (body) => runValidation(createSchema, body);

exports.toUpdateInput = (body) => runValidation(updateSchema, body);
