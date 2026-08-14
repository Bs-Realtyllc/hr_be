const db = require("../db");

const BASE_SELECT = `
  SELECT e.*, m.name AS manager_name
  FROM employees e
  LEFT JOIN employees m ON e.manager_id = m.id
`;

exports.findAllActive = async () => {
  const [rows] = await db.query(
    `${BASE_SELECT} WHERE e.is_active = TRUE ORDER BY e.name`,
  );
  return rows;
};

exports.findAllInActive = async () => {
  const [rows] = await db.query(
    `${BASE_SELECT} WHERE e.is_active IS NULL ORDER BY e.name`,
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(`${BASE_SELECT} WHERE e.id = ?`, [id]);
  return rows[0] || null;
};

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM employees WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0] || null;
};

exports.findBySecondaryEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM employees WHERE secondary_email = ? LIMIT 1",
    [email],
  );
  return rows[0] || null;
};

exports.findAuthByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT id, name, email, role, designation, department, password_hash
     FROM employees WHERE email = ? AND is_active = TRUE`,
    [email],
  );
  return rows[0] || null;
};

exports.findActiveBasicByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT id, name FROM employees WHERE email = ? AND is_active = TRUE",
    [email],
  );
  return rows[0] || null;
};

exports.findPasswordHashById = async (id) => {
  const [rows] = await db.query(
    "SELECT password_hash FROM employees WHERE id = ?",
    [id],
  );
  return rows[0]?.password_hash || null;
};

exports.updatePasswordHash = async (id, hash) => {
  await db.query("UPDATE employees SET password_hash = ? WHERE id = ?", [
    hash,
    id,
  ]);
};

exports.findNameById = async (id) => {
  const [rows] = await db.query(
    "SELECT name FROM employees WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] || null;
};

exports.findByDiscordUsername = async (discordUsername) => {
  const [rows] = await db.query(
    "SELECT id, name FROM employees WHERE discord_username = ? LIMIT 1",
    [discordUsername],
  );
  return rows[0] || null;
};

exports.findByNameLike = async (pattern) => {
  const [rows] = await db.query(
    "SELECT id, name FROM employees WHERE LOWER(name) LIKE LOWER(?) LIMIT 1",
    [pattern],
  );
  return rows[0] || null;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO employees
     (name, email, secondary_email, phone, emergency_contact, designation, department, manager_id, start_date, timezone, work_hours, tech_stack, role, dob,gender,current_address, permanent_address, education_level, institution_name, field_of_study, graduation_date, previous_experience,areas_of_interest,linkedin_url, github_url, portfolio_url, emergency_contact_name, discord_username,salary, pay_frequency,is_active, leave_policy_accepted, leave_policy_accepted_at )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      data.name,
      data.email,
      data.secondary_email,
      data.phone,
      data.emergency_contact,
      data.designation,
      data.department,
      data.manager_id,
      data.start_date,
      data.timezone,
      data.work_hours,
      JSON.stringify(data.tech_stack),
      data.role,
      data.dob,
      data.gender,
      data.current_address,
      data.permanent_address,
      data.education_level,
      data.institution_name,
      data.field_of_study,
      data.graduation_date,
      data.previous_experience,
      data.areas_of_interest,
      data.linkedin_url,
      data.github_url,
      data.portfolio_url,
      data.emergency_contact_name,
      data.discord_username,
      data.salary,
      data.pay_frequency,
      data.is_active,
      data.leave_policy_accepted,
      data.leave_policy_accepted_at,
    ],
  );
  return result.insertId;
};

exports.seedLeaveBalances = async (employeeId, year) => {
  await db.query(
    `INSERT INTO leave_balances (employee_id, leave_type, total, taken, year) VALUES
     (?, 'sick', 12, 0, ?),
     (?, 'bereavement', 3, 0, ?),
     (?, 'maternity', 60, 0, ?),
     (?, 'paternity', 30, 0, ?)`,
    [employeeId, year, employeeId, year, employeeId, year, employeeId, year],
  );
};

exports.update = async (id, updates) => {
  const fields = Object.keys(updates);
  if (!fields.length) return;
  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) =>
    f === "tech_stack" ? JSON.stringify(updates[f]) : updates[f],
  );
  values.push(id);
  await db.query(`UPDATE employees SET ${setClause} WHERE id = ?`, values);
};

exports.deactivate = async (id) => {
  await db.query("UPDATE employees SET is_active = FALSE WHERE id = ?", [id]);
};
//delete user
exports.delete = async (id) => {
await db.query("DELETE FROM employees WHERE id = ?", [id]);
};

exports.activate = async (id) => {
  await db.query("UPDATE employees SET is_active = TRUE WHERE id = ?", [id]);
};

exports.findPayrollBaseById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, name, designation, department, salary, pay_frequency, start_date
     FROM employees WHERE id = ? AND is_active = TRUE`,
    [id],
  );
  return rows[0] || null;
};

// id === null/undefined => all active employees; otherwise just that employee's row.
exports.findPayrollColumns = async (id) => {
  const query = id
    ? `SELECT id, name, designation, department, role, salary, pay_frequency FROM employees WHERE is_active = TRUE AND id = ? ORDER BY name`
    : `SELECT id, name, designation, department, role, salary, pay_frequency FROM employees WHERE is_active = TRUE ORDER BY name`;
  const params = id ? [id] : [];
  const [rows] = await db.query(query, params);
  return rows;
};

exports.updateSalary = async (id, salary, payFrequency) => {
  await db.query(
    "UPDATE employees SET salary = ?, pay_frequency = ? WHERE id = ?",
    [salary, payFrequency, id],
  );
};

const PROFILE_FIELDS = `id, name, email, phone, alt_phone, emergency_contact, designation, department,
              dob, bio, address, qualifications, profile_picture, citizenship_front, citizenship_back,
              timezone, work_hours, tech_stack, role, start_date,
              leave_policy_accepted, leave_policy_accepted_at`;

exports.findProfileById = async (id) => {
  const [rows] = await db.query(
    `SELECT ${PROFILE_FIELDS} FROM employees WHERE id = ? AND is_active = TRUE`,
    [id],
  );
  return rows[0] || null;
};

exports.findProfilePictureById = async (id) => {
  const [rows] = await db.query(
    "SELECT profile_picture FROM employees WHERE id = ?",
    [id],
  );
  return rows[0]?.profile_picture || null;
};

exports.updateProfilePicture = async (id, filename) => {
  await db.query("UPDATE employees SET profile_picture = ? WHERE id = ?", [
    filename,
    id,
  ]);
};

// column must be a trusted literal ('citizenship_front' | 'citizenship_back'), never raw user input
exports.findCitizenshipDocById = async (id, column) => {
  const [rows] = await db.query(
    `SELECT ${column} FROM employees WHERE id = ?`,
    [id],
  );
  return rows[0]?.[column] || null;
};

exports.updateCitizenshipDoc = async (id, column, filename) => {
  await db.query(`UPDATE employees SET ${column} = ? WHERE id = ?`, [
    filename,
    id,
  ]);
};

exports.acceptLeavePolicy = async (id) => {
  await db.query(
    "UPDATE employees SET leave_policy_accepted = TRUE, leave_policy_accepted_at = NOW() WHERE id = ?",
    [id],
  );
};

exports.findApprovedLeaveRangesForEmployee = async (
  id,
  rangeStart,
  rangeEnd,
) => {
  const [rows] = await db.query(
    `SELECT start_date, end_date FROM leave_requests
     WHERE employee_id = ? AND status = 'approved'
       AND start_date <= ? AND end_date >= ?`,
    [id, rangeEnd, rangeStart],
  );
  return rows;
};
