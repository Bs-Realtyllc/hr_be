const UPDATE_FIELDS = [
  "name",
  "phone",
  "secondary_email",
  "discord_username",
  "emergency_contact",
  "designation",
  "department",
  "manager_id",
  "timezone",
  "work_hours",
  "tech_stack",
  "role",
  "is_active"
];

exports.toCreateInput = (body) => {
  if (!body.name || !body.email) {
    const err = new Error("name and email are required");
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
    timezone: body.timezone || "UTC",
    work_hours: body.work_hours || "9 AM - 5 PM",
    tech_stack: body.tech_stack || [],
    role: body.role || "employee",
    dob: body.dob || null,
    gender: body.gender || "prefer_not_to_say",
    current_address: body.current_address || null,
    permanent_address: body.permanent_address || null,
    education_level: body.education_level || null,
    institution_name: body.institution_name || null,
    field_of_study: body.field_of_study || null,
    graduation_data: body.graduation_data || null,
    previous_experience: body.previous_experience || null,
    areas_of_interest: body.areas_of_interest || null,
    linkedin_url: body.linkedin_url || null,
    github_url: body.github_url || null,
    portfolio_url: body.portfolio_url || null,
    emergency_contact_name: body.emergency_contact_name || null,
    discord_username: body.discord_username || null,
    salary: body.salary || null,
    pay_frequency: body.pay_frequency || null,
    is_active: body.is_active || null,
    leave_policy_accepted: body.leave_policy_accepted || null,
    leave_policy_accepted_at: body.leave_policy_accepted_at || null,
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
