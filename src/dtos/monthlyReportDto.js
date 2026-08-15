const { z } = require('zod');

const createSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  notes: z.string().nullable(),
});

exports.toCreateInput = (body, file) => {
  const { employee_id, title, month, year, notes } = body;
  if (!employee_id || !title || !month || !year) {
    const err = new Error('employee_id, title, month and year are required');
    err.status = 400;
    throw err;
  }

  const result = createSchema.safeParse({ employee_id, title, month, year, notes: notes || null });
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }

  return {
    ...result.data,
    file_name: file.originalname,
    file_path: file.path,
    file_size: file.size,
  };
};
