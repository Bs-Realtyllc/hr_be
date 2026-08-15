const { z } = require('zod');

const saveSchema = z.object({
  service_name: z.string({ error: 'service_name is required' }).trim().min(1, 'service_name is required'),
  username: z.string().optional(),
  password: z.string().optional(),
  notes: z.string().optional(),
});

exports.toSaveInput = (body) => {
  const result = saveSchema.safeParse(body);
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  const { service_name, username, password, notes } = result.data;
  return {
    service_name,
    username: username || '',
    password: password || '',
    notes: notes || '',
  };
};
