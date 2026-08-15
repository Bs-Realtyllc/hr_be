const { z } = require('zod');

const SELF_SERVICE_FIELDS = ['phone', 'alt_phone', 'emergency_contact', 'dob', 'bio', 'address', 'timezone', 'work_hours'];

// Free-text self-service fields — the employee edits their own profile, so these
// stay permissive (any string), except dob which must be a real calendar date
// since it drives the birthday-event logic in profile.js.
const fieldSchemas = {
  phone: z.string(),
  alt_phone: z.string(),
  emergency_contact: z.string(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be a date in YYYY-MM-DD format'),
  bio: z.string(),
  address: z.string(),
  timezone: z.string(),
  work_hours: z.string(),
};

exports.toUpdateInput = (body) => {
  const updates = {};
  SELF_SERVICE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) {
      const value = body[f] || null;
      if (value !== null) {
        const result = fieldSchemas[f].safeParse(value);
        if (!result.success) {
          const err = new Error(`${f}: ${result.error.issues[0].message}`);
          err.status = 400;
          throw err;
        }
      }
      updates[f] = value;
    }
  });
  if (body.qualifications !== undefined) {
    updates.qualifications = JSON.stringify(body.qualifications);
  }
  return updates;
};
