const { z } = require('zod');
const { getWeekStartDate } = require('../pkg/weekUtil');

const createSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1),
  notes: z.string().nullable(),
});

exports.toCreateInput = (body, file) => {
  const { employee_id, title, notes } = body;
  if (!employee_id || !title) {
    const err = new Error('employee_id and title are required');
    err.status = 400;
    throw err;
  }

  const result = createSchema.safeParse({ employee_id, title, notes: notes || null });
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }

  return {
    ...result.data,
    week_start_date: getWeekStartDate(),
    file_name: file.originalname,
    file_path: file.path,
    file_size: file.size,
  };
};
