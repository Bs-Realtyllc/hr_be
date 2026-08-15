const { z } = require('zod');

// Accepts any string JS's Date can parse (ISO 8601 datetime-local input, etc.) —
// the DB column is DATETIME, and Meeting.create/gc.createMeetingEvent already
// pass these straight through as date strings.
const datetimeString = z.string().refine((v) => !isNaN(Date.parse(v)), 'must be a valid date/time');

const createSchema = z.object({
  title: z.string().trim().min(1, 'title, start_datetime, and end_datetime are required'),
  description: z.string().nullable(),
  start_datetime: datetimeString,
  end_datetime: datetimeString,
  attendees: z.array(z.unknown()),
}).refine((data) => new Date(data.end_datetime) > new Date(data.start_datetime), {
  message: 'end_datetime must be after start_datetime',
  path: ['end_datetime'],
});

exports.toCreateInput = (body) => {
  if (!body.title || !body.start_datetime || !body.end_datetime) {
    const err = new Error('title, start_datetime, and end_datetime are required');
    err.status = 400;
    throw err;
  }

  const result = createSchema.safeParse({
    title: body.title,
    description: body.description || null,
    start_datetime: body.start_datetime,
    end_datetime: body.end_datetime,
    attendees: body.attendees || [],
  });
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  return result.data;
};
