const { z } = require('zod');

const UPDATE_FIELDS = ['name', 'environment', 'ip_address', 'domain', 'ssh_user', 'notes', 'is_sensitive'];

// Matches the `servers.environment` ENUM in schema.sql.
const ENVIRONMENTS = ['development', 'staging', 'production'];

const fieldSchemas = {
  name: z.string().trim().min(1, 'name is required'),
  environment: z.enum(ENVIRONMENTS),
  ip_address: z.string().nullable(),
  domain: z.string().nullable(),
  ssh_user: z.string().nullable(),
  notes: z.string().nullable(),
  is_sensitive: z.coerce.boolean(),
};

function validateField(field, value) {
  if (value === undefined || value === null) return;
  const schema = fieldSchemas[field];
  if (!schema) return;
  const result = schema.safeParse(value);
  if (!result.success) {
    const err = new Error(`${field}: ${result.error.issues[0].message}`);
    err.status = 400;
    throw err;
  }
}

exports.toCreateInput = (body) => {
  const { project_id, name, environment, ip_address, domain, ssh_user, notes, is_sensitive } = body;

  if (!name || !environment) {
    const err = new Error('name and environment are required');
    err.status = 400;
    throw err;
  }

  validateField('name', name);
  validateField('environment', environment);
  validateField('ip_address', ip_address);
  validateField('domain', domain);
  validateField('ssh_user', ssh_user);
  validateField('notes', notes);

  return {
    project_id: project_id || null,
    name,
    environment,
    ip_address,
    domain,
    ssh_user,
    notes,
    is_sensitive: is_sensitive || false,
  };
};

exports.toUpdateInput = (body) => {
  const updates = {};
  UPDATE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) {
      validateField(f, body[f]);
      updates[f] = body[f];
    }
  });
  return updates;
};

// Mask sensitive fields unless the caller explicitly asked to see them (role-based in real app).
exports.toResponseList = (rows, showSensitive) => rows.map((r) => ({
  ...r,
  ip_address: showSensitive ? r.ip_address : r.is_sensitive ? '••••••••' : r.ip_address,
  ssh_user: showSensitive ? r.ssh_user : r.is_sensitive ? '••••••••' : r.ssh_user,
}));
