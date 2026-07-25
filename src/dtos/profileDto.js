const SELF_SERVICE_FIELDS = ['phone', 'alt_phone', 'emergency_contact', 'dob', 'bio', 'address', 'timezone', 'work_hours'];

exports.toUpdateInput = (body) => {
  const updates = {};
  SELF_SERVICE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) updates[f] = body[f] || null;
  });
  if (body.qualifications !== undefined) {
    updates.qualifications = JSON.stringify(body.qualifications);
  }
  return updates;
};
