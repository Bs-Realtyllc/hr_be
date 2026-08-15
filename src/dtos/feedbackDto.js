const { z } = require('zod');

// Matches the `feedback_notes` table ENUMs in schema.sql.
const FEEDBACK_TYPES = ['praise', 'constructive', 'peer', 'manager'];
const VISIBILITIES = ['public', 'private'];

const createSchema = z.object({
  from_employee_id: z.coerce.number().int().positive(),
  to_employee_id: z.coerce.number().int().positive(),
  feedback_type: z.enum(FEEDBACK_TYPES),
  visibility: z.enum(VISIBILITIES),
  message: z.string().trim().min(1, 'Message is required'),
  project_id: z.coerce.number().int().positive().nullable(),
});

exports.toCreateInput = (body, fromEmployeeId) => {
  const result = createSchema.safeParse({
    from_employee_id: fromEmployeeId,
    to_employee_id: body.to_employee_id,
    feedback_type: body.feedback_type || 'praise',
    visibility: body.visibility || 'public',
    message: body.message,
    project_id: body.project_id || null,
  });
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  return result.data;
};
