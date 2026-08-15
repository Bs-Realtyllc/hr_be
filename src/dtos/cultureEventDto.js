const { z } = require('zod');

// Matches the `culture_events.event_type` ENUM in schema.sql.
const EVENT_TYPES = ['birthday', 'anniversary', 'team_event', 'milestone'];

const createSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  event_type: z.enum(EVENT_TYPES),
  employee_id: z.coerce.number().int().positive().nullable(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'event_date must be in YYYY-MM-DD format'),
  description: z.string().nullable(),
});

exports.toCreateInput = (body) => {
  const result = createSchema.safeParse({
    title: body.title,
    event_type: body.event_type,
    employee_id: body.employee_id || null,
    event_date: body.event_date,
    description: body.description || null,
  });
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  return result.data;
};
