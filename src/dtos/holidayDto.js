const { z } = require('zod');

const createSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'holiday_date must be in YYYY-MM-DD format'),
  year: z.coerce.number().int(),
  message: z.string().nullable(),
});

exports.toCreateInput = (body) => {
  const result = createSchema.safeParse({
    name: body.name,
    holiday_date: body.holiday_date,
    year: body.year || new Date(body.holiday_date).getFullYear(),
    message: body.message || null,
  });
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  return result.data;
};
