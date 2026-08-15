const { z } = require('zod');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

const saveSchema = z.object({
  smtp_host: z.string().trim().min(1),
  smtp_port: z.coerce.number().int().min(1).max(65535),
  smtp_user: z.string().trim().min(1),
  smtp_pass: z.string(),
  smtp_from: z.string(),
  default_to: z.string(),
  default_cc: z.string(),
  default_bcc: z.string(),
});

exports.toSaveInput = (body) => {
  const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, default_to, default_cc, default_bcc } = body;
  if (!smtp_host || !smtp_user) throw badRequest('smtp_host and smtp_user are required');

  const result = saveSchema.safeParse({
    smtp_host,
    smtp_port: smtp_port || 587,
    smtp_user,
    smtp_pass: smtp_pass || '',
    smtp_from: smtp_from || smtp_user,
    default_to: default_to || '',
    default_cc: default_cc || '',
    default_bcc: default_bcc || '',
  });
  if (!result.success) throw badRequest(result.error.issues[0].message);
  return result.data;
};
