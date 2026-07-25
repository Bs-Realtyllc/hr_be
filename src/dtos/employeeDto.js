const UPDATE_FIELDS = [
  'name', 'phone', 'secondary_email', 'discord_username', 'emergency_contact', 'designation',
  'department', 'manager_id', 'timezone', 'work_hours', 'tech_stack', 'role',
];

exports.toCreateInput = (body) => {
  if (!body.name || !body.email) {
    const err = new Error('name and email are required');
    err.status = 400;
    throw err;
  }
  return {
    name: body.name,
    email: body.email,
    secondary_email: body.secondary_email || null,
    phone: body.phone || null,
    emergency_contact: body.emergency_contact || null,
    designation: body.designation || null,
    department: body.department || null,
    manager_id: body.manager_id || null,
    start_date: body.start_date || null,
    timezone: body.timezone || 'UTC',
    work_hours: body.work_hours || '9 AM - 5 PM',
    tech_stack: body.tech_stack || [],
    role: body.role || 'employee',
  };
};

exports.toUpdateInput = (body) => {
  const updates = {};
  UPDATE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) updates[f] = body[f];
  });
  return updates;
};

// Strip fields that should never reach the client (password_hash).
exports.toResponse = (employee) => {
  if (!employee) return employee;
  const { password_hash, ...safe } = employee;
  return safe;
};

exports.toResponseList = (employees) => employees.map(exports.toResponse);
