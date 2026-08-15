const db = require('../db');

// Phase 4: reads come from `employees_flat`, a view that reproduces the exact
// column shape `employees` had pre-redesign by joining the new normalized
// tables back together (see db/migrate_normalize_employees_p2.sql). Writes
// still target `employees`/the new tables directly — this only affects reads,
// so every function below keeps returning identically-shaped rows to before.
const BASE_SELECT = `
  SELECT e.*, m.name AS manager_name
  FROM employees_flat e
  LEFT JOIN employees_flat m ON e.manager_id = m.id
`;

exports.findAllActive = async () => {
  const [rows] = await db.query(`${BASE_SELECT} WHERE e.is_active = TRUE ORDER BY e.name`);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(`${BASE_SELECT} WHERE e.id = ?`, [id]);
  return rows[0] || null;
};

exports.findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM employees_flat WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
};

exports.findBySecondaryEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM employees_flat WHERE secondary_email = ? LIMIT 1', [email]);
  return rows[0] || null;
};

exports.findAuthByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT id, name, email, role, designation, department, password_hash
     FROM employees_flat WHERE email = ? AND is_active = TRUE`,
    [email]
  );
  return rows[0] || null;
};

exports.findActiveBasicByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT id, name FROM employees_flat WHERE email = ? AND is_active = TRUE',
    [email]
  );
  return rows[0] || null;
};

exports.findPasswordHashById = async (id) => {
  const [rows] = await db.query('SELECT password_hash FROM employees_flat WHERE id = ?', [id]);
  return rows[0]?.password_hash || null;
};

exports.updatePasswordHash = async (id, hash) => {
  await exports.upsertAuth(db, id, { password_hash: hash });
};

exports.findNameById = async (id) => {
  const [rows] = await db.query('SELECT name FROM employees WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

exports.findByDiscordUsername = async (discordUsername) => {
  const [rows] = await db.query(
    'SELECT id, name FROM employees_flat WHERE discord_username = ? LIMIT 1',
    [discordUsername]
  );
  return rows[0] || null;
};

exports.findByNameLike = async (pattern) => {
  const [rows] = await db.query(
    'SELECT id, name FROM employees WHERE LOWER(name) LIKE LOWER(?) LIMIT 1',
    [pattern]
  );
  return rows[0] || null;
};

exports.create = async (data) => {
  if (data.manager_id != null && Number(data.manager_id) < 1) {
    const err = new Error('Invalid manager_id');
    err.status = 400;
    throw err;
  }
  // A brand-new employee has no id yet, so it can't already be an ancestor of
  // the proposed manager — no cycle check needed here, unlike update().

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const departmentId = await findOrCreateDepartmentId(conn, data.department);
    const designationId = await findOrCreateDesignationId(conn, data.designation);
    const effectiveFrom = data.start_date || new Date().toISOString().slice(0, 10);

    // Post-Phase-5: `employees` only carries core identity + current-state
    // pointer columns. phone/emergency_contact/timezone/work_hours/role live
    // exclusively on the new tables now — see upsertAuth/upsertProfile below.
    const [result] = await conn.query(
      `INSERT INTO employees
       (name, email, secondary_email, manager_id, start_date, tech_stack, qualifications, designation_id, department_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.email, data.secondary_email, data.manager_id, data.start_date,
       JSON.stringify(data.tech_stack), JSON.stringify(data.qualifications ?? []), designationId, departmentId]
    );
    const employeeId = result.insertId;

    await exports.upsertAuth(conn, employeeId, { password_hash: null, role: data.role });
    await exports.upsertProfile(conn, employeeId, {
      phone: data.phone, emergency_contact: data.emergency_contact,
      timezone: data.timezone, work_hours: data.work_hours,
    });

    await conn.query(
      `INSERT INTO employee_job_history
         (employee_id, designation_id, department_id, manager_id, effective_from, change_reason)
       VALUES (?, ?, ?, ?, ?, 'hire')`,
      [employeeId, designationId, departmentId, data.manager_id, effectiveFrom]
    );

    await conn.commit();
    return employeeId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Resolves free-text department/designation to their lookup-table id, creating
// the lookup row on first use if it doesn't exist yet. Keeps the new tables in
// sync without requiring every caller to pre-seed departments/designations.
async function findOrCreateDepartmentId(conn, name) {
  if (!name) return null;
  await conn.query('INSERT IGNORE INTO departments (name) VALUES (?)', [name]);
  const [[row]] = await conn.query('SELECT id FROM departments WHERE name = ?', [name]);
  return row?.id ?? null;
}

async function findOrCreateDesignationId(conn, title) {
  if (!title) return null;
  await conn.query('INSERT IGNORE INTO designations (title) VALUES (?)', [title]);
  const [[row]] = await conn.query('SELECT id FROM designations WHERE title = ?', [title]);
  return row?.id ?? null;
}

exports.seedLeaveBalances = async (employeeId, year) => {
  await db.query(
    `INSERT INTO leave_balances (employee_id, leave_type, total, taken, year) VALUES
     (?, 'sick', 12, 0, ?),
     (?, 'bereavement', 3, 0, ?),
     (?, 'maternity', 60, 0, ?),
     (?, 'paternity', 30, 0, ?)`,
    [employeeId, year, employeeId, year, employeeId, year, employeeId, year]
  );
};

// Fields that live on employee_auth / employee_profile post-Phase-5.
// Anything not listed here (name, email, secondary_email, tech_stack,
// qualifications) is one of the few columns still physically on `employees`.
const AUTH_FIELDS = ['role', 'password_hash'];
const PROFILE_UPDATE_FIELDS = [
  'phone', 'alt_phone', 'discord_username', 'emergency_contact', 'dob', 'bio', 'address',
  'timezone', 'work_hours', 'leave_policy_accepted', 'leave_policy_accepted_at',
];
// Columns still physically present on `employees` after Phase 5's DROP COLUMN.
const EMPLOYEES_TABLE_FIELDS = ['name', 'email', 'secondary_email', 'tech_stack', 'qualifications', 'manager_id', 'start_date'];

exports.update = async (id, updates) => {
  const fields = Object.keys(updates);
  if (!fields.length) return;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const employeesFields = fields.filter((f) => EMPLOYEES_TABLE_FIELDS.includes(f));
    if (employeesFields.length) {
      // tech_stack arrives as a raw array from employeeDto and needs stringifying
      // here; qualifications arrives already-stringified from profileDto — see
      // profileDto.toUpdateInput — so it must NOT be re-stringified.
      const setClause = employeesFields.map((f) => `${f} = ?`).join(', ');
      const values = employeesFields.map((f) => (f === 'tech_stack' ? JSON.stringify(updates[f]) : updates[f]));
      values.push(id);
      await conn.query(`UPDATE employees SET ${setClause} WHERE id = ?`, values);
    }

    if (fields.some((f) => AUTH_FIELDS.includes(f))) {
      await exports.upsertAuth(conn, id, {
        password_hash: updates.password_hash,
        role: updates.role,
      });
    }

    const profileUpdates = {};
    for (const f of PROFILE_UPDATE_FIELDS) {
      if (updates[f] !== undefined) profileUpdates[f] = updates[f];
    }
    if (Object.keys(profileUpdates).length) {
      await exports.upsertProfile(conn, id, profileUpdates);
    }

    // designation/department/manager_id changing means a job-history event —
    // only record one if at least one of the three was actually part of this update.
    if (['designation', 'department', 'manager_id'].some((f) => fields.includes(f))) {
      if (fields.includes('manager_id')) {
        await exports.assertNoManagerCycle(id, updates.manager_id);
      }
      // Reads designation_id/department_id directly (permanent columns, not
      // the free-text designation/department — those are dropped in Phase 5)
      // so this keeps working after the legacy text columns are gone.
      const [[current]] = await conn.query(
        'SELECT designation_id, department_id, manager_id FROM employees WHERE id = ?', [id]
      );
      const departmentId = fields.includes('department')
        ? await findOrCreateDepartmentId(conn, updates.department)
        : current.department_id;
      const designationId = fields.includes('designation')
        ? await findOrCreateDesignationId(conn, updates.designation)
        : current.designation_id;
      const managerId = fields.includes('manager_id') ? updates.manager_id : current.manager_id;

      await exports.recordJobChange(conn, id, {
        designationId, departmentId, managerId, changeReason: 'update',
      });
      await conn.query(
        'UPDATE employees SET designation_id = ?, department_id = ? WHERE id = ?',
        [designationId, departmentId, id]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.deactivate = async (id) => {
  // status kept in sync with is_active, same as the Phase 1 backfill did —
  // every existing `WHERE is_active = TRUE` query keeps working unmodified.
  await db.query("UPDATE employees SET is_active = FALSE, status = 'terminated' WHERE id = ?", [id]);
};

exports.findPayrollBaseById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, name, designation, department, salary, pay_frequency, start_date
     FROM employees_flat WHERE id = ? AND is_active = TRUE`,
    [id]
  );
  return rows[0] || null;
};

// id === null/undefined => all active employees; otherwise just that employee's row.
exports.findPayrollColumns = async (id) => {
  const query = id
    ? `SELECT id, name, designation, department, role, salary, pay_frequency FROM employees_flat WHERE is_active = TRUE AND id = ? ORDER BY name`
    : `SELECT id, name, designation, department, role, salary, pay_frequency FROM employees_flat WHERE is_active = TRUE ORDER BY name`;
  const params = id ? [id] : [];
  const [rows] = await db.query(query, params);
  return rows;
};

exports.updateSalary = async (id, salary, payFrequency) => {
  // A null salary (payroll UI allows clearing it) has nothing to record as a
  // compensation-history event — just close out the current row, if any.
  if (salary == null) {
    await db.query(
      'UPDATE employee_compensation_history SET effective_to = CURDATE() WHERE employee_id = ? AND effective_to IS NULL',
      [id]
    );
  } else {
    await exports.recordCompensationChange(db, id, {
      salary, payFrequency, changeReason: 'salary_update',
    });
  }
};

const PROFILE_FIELDS = `id, name, email, phone, alt_phone, emergency_contact, designation, department,
              dob, bio, address, qualifications, profile_picture, citizenship_front, citizenship_back,
              timezone, work_hours, tech_stack, role, start_date,
              leave_policy_accepted, leave_policy_accepted_at`;

exports.findProfileById = async (id) => {
  const [rows] = await db.query(
    `SELECT ${PROFILE_FIELDS} FROM employees_flat WHERE id = ? AND is_active = TRUE`,
    [id]
  );
  return rows[0] || null;
};

exports.findProfilePictureById = async (id) => {
  const [rows] = await db.query('SELECT profile_picture FROM employees_flat WHERE id = ?', [id]);
  return rows[0]?.profile_picture || null;
};

exports.updateProfilePicture = async (id, filename) => {
  await exports.recordDocumentUpload(db, id, 'profile_picture', filename, id);
};

// column must be a trusted literal ('citizenship_front' | 'citizenship_back'), never raw user input
exports.findCitizenshipDocById = async (id, column) => {
  const [rows] = await db.query(`SELECT ${column} FROM employees_flat WHERE id = ?`, [id]);
  return rows[0]?.[column] || null;
};

exports.updateCitizenshipDoc = async (id, column, filename) => {
  await exports.recordDocumentUpload(db, id, column, filename, id);
};

exports.acceptLeavePolicy = async (id) => {
  await exports.upsertProfile(db, id, { leave_policy_accepted: true, leave_policy_accepted_at: new Date() });
};

exports.findApprovedLeaveRangesForEmployee = async (id, rangeStart, rangeEnd) => {
  const [rows] = await db.query(
    `SELECT start_date, end_date FROM leave_requests
     WHERE employee_id = ? AND status = 'approved'
       AND start_date <= ? AND end_date >= ?`,
    [id, rangeEnd, rangeStart]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────
// Normalization write helpers for the new tables (employee_auth,
// employee_profile, employee_job_history, employee_compensation_history,
// employee_documents). As of Phase 3, every write path above dual-writes:
// the legacy `employees` columns first (so a failure here rolls back to
// exactly pre-Phase-3 behavior), then these. Reads still come exclusively
// from `employees` until Phase 4 cuts over to the compatibility view.
// Exported (not truly private) so they're independently testable/reusable
// and so db/migrate_employee_data.js can call them directly.
// ─────────────────────────────────────────────────────────────────────────

// Manager-cycle guard: walks up the proposed manager's chain and rejects if
// `employeeId` would become its own ancestor. MySQL can't express this
// declaratively for a self-referential tree, so it's enforced here.
// Bounded depth avoids an infinite loop if bad data already has a cycle.
// Deliberately reads via the pool (committed state), not the caller's
// in-flight transaction connection — it's validating against the graph as it
// exists right now, not against this update's own not-yet-committed change.
const MAX_MANAGER_CHAIN_DEPTH = 20;
exports.assertNoManagerCycle = async (employeeId, proposedManagerId) => {
  if (proposedManagerId == null) return;
  if (Number(proposedManagerId) === Number(employeeId)) {
    const err = new Error('An employee cannot be their own manager');
    err.status = 400;
    throw err;
  }
  let currentId = proposedManagerId;
  for (let depth = 0; depth < MAX_MANAGER_CHAIN_DEPTH; depth++) {
    const [rows] = await db.query('SELECT manager_id FROM employees WHERE id = ?', [currentId]);
    const nextManagerId = rows[0]?.manager_id;
    if (nextManagerId == null) return; // reached the top of the chain, no cycle
    if (Number(nextManagerId) === Number(employeeId)) {
      const err = new Error('This manager change would create a reporting cycle');
      err.status = 400;
      throw err;
    }
    currentId = nextManagerId;
  }
  // Chain exceeded the bound — likely pre-existing bad data; don't block the
  // write on it, but this is worth surfacing in logs.
  console.warn(`assertNoManagerCycle: manager chain from ${proposedManagerId} exceeded depth ${MAX_MANAGER_CHAIN_DEPTH}`);
};

// IMPORTANT: pass `role: undefined`/omit it when the caller isn't changing
// role (e.g. a password-only update) — it must reach this function as
// undefined/null, NOT pre-defaulted to 'employee' in JS, or the COALESCE
// below never fires and an unrelated write silently resets an existing
// admin/lead back to 'employee'. Only a genuinely new employee_auth row
// (INSERT branch) falls back to 'employee', via SQL's own IFNULL.
exports.upsertAuth = async (conn, employeeId, { password_hash, role }) => {
  await conn.query(
    `INSERT INTO employee_auth (employee_id, password_hash, role)
     VALUES (?, ?, IFNULL(?, 'employee'))
     ON DUPLICATE KEY UPDATE
       password_hash = COALESCE(VALUES(password_hash), password_hash),
       role = COALESCE(?, role)`,
    [employeeId, password_hash ?? null, role ?? null, role ?? null]
  );
};

const PROFILE_COLUMNS = [
  'phone', 'alt_phone', 'discord_username', 'emergency_contact', 'dob', 'bio', 'address',
  'timezone', 'work_hours', 'leave_policy_accepted', 'leave_policy_accepted_at',
];
exports.upsertProfile = async (conn, employeeId, fields) => {
  const present = PROFILE_COLUMNS.filter((f) => fields[f] !== undefined);
  if (!present.length) return;
  const insertCols = ['employee_id', ...present];
  const insertVals = [employeeId, ...present.map((f) => fields[f])];
  const placeholders = insertVals.map(() => '?').join(', ');
  const updateClause = present.map((f) => `${f} = VALUES(${f})`).join(', ');
  await conn.query(
    `INSERT INTO employee_profile (${insertCols.join(', ')}) VALUES (${placeholders})
     ON DUPLICATE KEY UPDATE ${updateClause}`,
    insertVals
  );
};

// Closes out the current job_history row (if any) and inserts a new one.
// Only call this when designation/department/manager actually changed.
exports.recordJobChange = async (conn, employeeId, { designationId, departmentId, managerId, changeReason, changedBy }) => {
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  await conn.query(
    `UPDATE employee_job_history SET effective_to = ?
     WHERE employee_id = ? AND effective_to IS NULL`,
    [effectiveFrom, employeeId]
  );
  await conn.query(
    `INSERT INTO employee_job_history
       (employee_id, designation_id, department_id, manager_id, effective_from, change_reason, changed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [employeeId, designationId ?? null, departmentId ?? null, managerId ?? null, effectiveFrom, changeReason ?? null, changedBy ?? null]
  );
};

// Closes out the current compensation_history row (if any) and inserts a new one.
exports.recordCompensationChange = async (conn, employeeId, { salary, payFrequency, changeReason, changedBy }) => {
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  await conn.query(
    `UPDATE employee_compensation_history SET effective_to = ?
     WHERE employee_id = ? AND effective_to IS NULL`,
    [effectiveFrom, employeeId]
  );
  await conn.query(
    `INSERT INTO employee_compensation_history
       (employee_id, salary, pay_frequency, effective_from, change_reason, changed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [employeeId, salary, payFrequency ?? 'monthly', effectiveFrom, changeReason ?? null, changedBy ?? null]
  );
};

// Marks any existing current document of this type as superseded, then inserts
// the new one — keeps prior versions with is_current=FALSE as a free history.
exports.recordDocumentUpload = async (conn, employeeId, docType, filename, uploadedBy) => {
  await conn.query(
    `UPDATE employee_documents SET is_current = FALSE
     WHERE employee_id = ? AND doc_type = ? AND is_current = TRUE`,
    [employeeId, docType]
  );
  await conn.query(
    `INSERT INTO employee_documents (employee_id, doc_type, filename, uploaded_by, is_current)
     VALUES (?, ?, ?, ?, TRUE)`,
    [employeeId, docType, filename, uploadedBy ?? null]
  );
};
