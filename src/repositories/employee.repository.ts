import { fn, col, QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../config/database';
import {
  Employee,
  EmployeeAuth,
  EmployeeProfile,
  EmployeeJobHistory,
  EmployeeCompensationHistory,
  EmployeeDocument,
  Department,
  Designation,
  EmployeeFlat,
} from '../models';

// Same exported function names/signatures as the old src/models/Employee.js —
// every other domain's controller/service that does
// `require('../models/Employee')` now points at this file instead (see the
// grep-bounded list of call sites in the migration plan) and keeps working
// unmodified. New callers (employee.service.ts) additionally pass an
// `actorId` (from req.user.id) so writes populate created_by/updated_by —
// existing callers that omit it simply leave those columns null, same as
// they do today by never setting them at all.

function throwStatus(message: string, status: number): never {
  const err: any = new Error(message);
  err.status = status;
  throw err;
}

// employees_flat rows come back with a nested `manager: { name }` from the
// self-join include — flatten to `manager_name` to match the exact shape the
// old hand-written `LEFT JOIN employees_flat m` query returned.
function flattenManager(row: any) {
  if (!row) return row;
  const plain = row.toJSON ? row.toJSON() : row;
  const { manager, ...rest } = plain;
  return { ...rest, manager_name: manager?.name ?? null };
}

export async function findAllActive() {
  const rows = await EmployeeFlat.findAll({
    where: { is_active: true },
    include: [{ model: EmployeeFlat, as: 'manager', attributes: ['name'] }],
    order: [['name', 'ASC']],
  });
  return rows.map(flattenManager);
}

export async function findById(id: number | string) {
  const row = await EmployeeFlat.findOne({
    where: { id },
    include: [{ model: EmployeeFlat, as: 'manager', attributes: ['name'] }],
  });
  return row ? flattenManager(row) : null;
}

export async function findByEmail(email: string) {
  const row = await EmployeeFlat.findOne({ where: { email } });
  return row ? row.toJSON() : null;
}

export async function findBySecondaryEmail(email: string) {
  const row = await EmployeeFlat.findOne({ where: { secondary_email: email } });
  return row ? row.toJSON() : null;
}

export async function findAuthByEmail(email: string) {
  const row = await EmployeeFlat.findOne({
    where: { email, is_active: true },
    attributes: ['id', 'name', 'email', 'role', 'designation', 'department', 'password_hash'],
  });
  return row ? row.toJSON() : null;
}

export async function findActiveBasicByEmail(email: string) {
  const row = await EmployeeFlat.findOne({
    where: { email, is_active: true },
    attributes: ['id', 'name'],
  });
  return row ? row.toJSON() : null;
}

export async function findPasswordHashById(id: number | string) {
  const row = await EmployeeFlat.findOne({ where: { id }, attributes: ['password_hash'] });
  return row?.password_hash || null;
}

export async function updatePasswordHash(id: number | string, hash: string) {
  await upsertAuth(id, { password_hash: hash });
}

export async function findNameById(id: number | string) {
  const row = await Employee.findByPk(id, { attributes: ['name'] });
  return row ? row.toJSON() : null;
}

export async function findByDiscordUsername(discordUsername: string) {
  const row = await EmployeeFlat.findOne({
    where: { discord_username: discordUsername },
    attributes: ['id', 'name'],
  });
  return row ? row.toJSON() : null;
}

// `pattern` arrives pre-wrapped with SQL LIKE wildcards (e.g. `%bob%`) from
// callers — same contract as the original.
export async function findByNameLike(pattern: string) {
  const row = await Employee.findOne({
    where: sequelize.where(fn('LOWER', col('name')), 'LIKE', pattern.toLowerCase()),
    attributes: ['id', 'name'],
  });
  return row ? row.toJSON() : null;
}

// Resolves free-text department/designation to their lookup-table id, creating
// the lookup row on first use if it doesn't exist yet.
async function findOrCreateDepartmentId(name: string | null | undefined, transaction: Transaction) {
  if (!name) return null;
  const [dept] = await Department.findOrCreate({
    where: { name },
    defaults: { name, is_active: true, created_at: new Date() } as any,
    transaction,
  });
  return dept.id;
}

async function findOrCreateDesignationId(title: string | null | undefined, transaction: Transaction) {
  if (!title) return null;
  const [desig] = await Designation.findOrCreate({
    where: { title },
    defaults: { title, is_active: true, created_at: new Date() } as any,
    transaction,
  });
  return desig.id;
}

export async function create(data: any, actorId: number | null = null) {
  if (data.manager_id != null && Number(data.manager_id) < 1) {
    throwStatus('Invalid manager_id', 400);
  }
  // A brand-new employee has no id yet, so it can't already be an ancestor of
  // the proposed manager — no cycle check needed here, unlike update().

  return sequelize.transaction(async (transaction) => {
    const departmentId = await findOrCreateDepartmentId(data.department, transaction);
    const designationId = await findOrCreateDesignationId(data.designation, transaction);
    const effectiveFrom = data.start_date || new Date().toISOString().slice(0, 10);

    const employee = await Employee.create(
      {
        name: data.name,
        email: data.email,
        secondary_email: data.secondary_email ?? null,
        manager_id: data.manager_id ?? null,
        start_date: data.start_date ?? null,
        tech_stack: data.tech_stack,
        qualifications: data.qualifications ?? [],
        designation_id: designationId,
        department_id: departmentId,
        created_by: actorId,
        updated_by: actorId,
        created_at: new Date(),
      } as any,
      { transaction }
    );
    const employeeId = employee.id;

    await upsertAuth(employeeId, { password_hash: null, role: data.role }, transaction, actorId);
    await upsertProfile(
      employeeId,
      {
        phone: data.phone,
        emergency_contact: data.emergency_contact,
        timezone: data.timezone,
        work_hours: data.work_hours,
      },
      transaction,
      actorId
    );

    await EmployeeJobHistory.create(
      {
        employee_id: employeeId,
        designation_id: designationId,
        department_id: departmentId,
        manager_id: data.manager_id ?? null,
        effective_from: effectiveFrom,
        change_reason: 'hire',
        created_at: new Date(),
      } as any,
      { transaction }
    );

    return employeeId;
  });
}

export async function seedLeaveBalances(employeeId: number | string, year: number) {
  await sequelize.query(
    `INSERT INTO leave_balances (employee_id, leave_type, total, taken, year) VALUES
     (:employeeId, 'sick', 12, 0, :year),
     (:employeeId, 'bereavement', 3, 0, :year),
     (:employeeId, 'maternity', 60, 0, :year),
     (:employeeId, 'paternity', 30, 0, :year)`,
    { replacements: { employeeId, year }, type: QueryTypes.INSERT }
  );
}

// Fields that live on employee_auth / employee_profile post-Phase-5.
// Anything not listed here (name, email, secondary_email, tech_stack,
// qualifications) is one of the few columns still physically on `employees`.
const AUTH_FIELDS = ['role', 'password_hash'];
const PROFILE_UPDATE_FIELDS = [
  'phone', 'alt_phone', 'discord_username', 'emergency_contact', 'dob', 'bio', 'address',
  'timezone', 'work_hours', 'leave_policy_accepted', 'leave_policy_accepted_at',
];
const EMPLOYEES_TABLE_FIELDS = ['name', 'email', 'secondary_email', 'tech_stack', 'qualifications', 'manager_id', 'start_date'];

export async function update(id: number | string, updates: Record<string, any>, actorId: number | null = null) {
  const fields = Object.keys(updates);
  if (!fields.length) return;

  await sequelize.transaction(async (transaction) => {
    const employeesFields = fields.filter((f) => EMPLOYEES_TABLE_FIELDS.includes(f));
    if (employeesFields.length) {
      const setValues: Record<string, any> = { updated_by: actorId };
      for (const f of employeesFields) setValues[f] = updates[f];
      await Employee.update(setValues, { where: { id }, transaction });
    }

    if (fields.some((f) => AUTH_FIELDS.includes(f))) {
      await upsertAuth(id, { password_hash: updates.password_hash, role: updates.role }, transaction, actorId);
    }

    const profileUpdates: Record<string, any> = {};
    for (const f of PROFILE_UPDATE_FIELDS) {
      if (updates[f] !== undefined) profileUpdates[f] = updates[f];
    }
    if (Object.keys(profileUpdates).length) {
      await upsertProfile(id, profileUpdates, transaction, actorId);
    }

    // designation/department/manager_id changing means a job-history event —
    // only record one if at least one of the three was actually part of this update.
    if (['designation', 'department', 'manager_id'].some((f) => fields.includes(f))) {
      if (fields.includes('manager_id')) {
        await assertNoManagerCycle(id, updates.manager_id);
      }
      const current = await Employee.findByPk(id, {
        attributes: ['designation_id', 'department_id', 'manager_id'],
        transaction,
      });
      const departmentId = fields.includes('department')
        ? await findOrCreateDepartmentId(updates.department, transaction)
        : current?.get('department_id');
      const designationId = fields.includes('designation')
        ? await findOrCreateDesignationId(updates.designation, transaction)
        : current?.get('designation_id');
      const managerId = fields.includes('manager_id') ? updates.manager_id : current?.get('manager_id');

      await recordJobChange(id, { designationId, departmentId, managerId, changeReason: 'update' }, transaction);
      await Employee.update(
        { designation_id: designationId, department_id: departmentId, updated_by: actorId },
        { where: { id }, transaction }
      );
    }
  });
}

export async function deactivate(id: number | string, actorId: number | null = null) {
  // status kept in sync with is_active, same as the Phase 1 backfill did —
  // every existing `WHERE is_active = TRUE` query keeps working unmodified.
  await Employee.update(
    { is_active: false, status: 'terminated', updated_by: actorId },
    { where: { id } }
  );
}

export async function findPayrollBaseById(id: number | string) {
  const row = await EmployeeFlat.findOne({
    where: { id, is_active: true },
    attributes: ['id', 'name', 'designation', 'department', 'salary', 'pay_frequency', 'start_date'],
  });
  return row ? row.toJSON() : null;
}

// id === null/undefined => all active employees; otherwise just that employee's row.
export async function findPayrollColumns(id: number | string | null) {
  const rows = await EmployeeFlat.findAll({
    where: id ? { is_active: true, id } : { is_active: true },
    attributes: ['id', 'name', 'designation', 'department', 'role', 'salary', 'pay_frequency'],
    order: [['name', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
}

export async function updateSalary(id: number | string, salary: number | null, payFrequency: string | null, actorId: number | null = null) {
  // A null salary (payroll UI allows clearing it) has nothing to record as a
  // compensation-history event — just close out the current row, if any.
  if (salary == null) {
    await sequelize.query(
      `UPDATE employee_compensation_history SET effective_to = CURDATE()
       WHERE employee_id = :id AND effective_to IS NULL`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );
  } else {
    await recordCompensationChange(id, { salary, payFrequency, changeReason: 'salary_update', changedBy: actorId });
  }
}

const PROFILE_FIELDS = [
  'id', 'name', 'email', 'phone', 'alt_phone', 'emergency_contact', 'designation', 'department',
  'dob', 'bio', 'address', 'qualifications', 'profile_picture', 'citizenship_front', 'citizenship_back',
  'timezone', 'work_hours', 'tech_stack', 'role', 'start_date',
  'leave_policy_accepted', 'leave_policy_accepted_at',
];

export async function findProfileById(id: number | string) {
  const row = await EmployeeFlat.findOne({
    where: { id, is_active: true },
    attributes: PROFILE_FIELDS,
  });
  return row ? row.toJSON() : null;
}

export async function findProfilePictureById(id: number | string) {
  const row = await EmployeeFlat.findOne({ where: { id }, attributes: ['profile_picture'] });
  return row?.profile_picture || null;
}

export async function updateProfilePicture(id: number | string, filename: string) {
  await recordDocumentUpload(id, 'profile_picture', filename, id);
}

// column must be a trusted literal ('citizenship_front' | 'citizenship_back'), never raw user input
const CITIZENSHIP_COLUMNS = new Set(['citizenship_front', 'citizenship_back']);
export async function findCitizenshipDocById(id: number | string, column: string) {
  if (!CITIZENSHIP_COLUMNS.has(column)) throwStatus('Invalid document column', 400);
  const row = await EmployeeFlat.findOne({ where: { id }, attributes: [column] });
  return (row as any)?.[column] || null;
}

export async function updateCitizenshipDoc(id: number | string, column: string, filename: string) {
  await recordDocumentUpload(id, column, filename, id);
}

export async function acceptLeavePolicy(id: number | string) {
  await upsertProfile(id, { leave_policy_accepted: true, leave_policy_accepted_at: new Date() });
}

export async function findApprovedLeaveRangesForEmployee(id: number | string, rangeStart: string, rangeEnd: string) {
  return sequelize.query(
    `SELECT start_date, end_date FROM leave_requests
     WHERE employee_id = :id AND status = 'approved'
       AND start_date <= :rangeEnd AND end_date >= :rangeStart`,
    { replacements: { id, rangeStart, rangeEnd }, type: QueryTypes.SELECT }
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Normalization write helpers for employee_auth / employee_profile /
// employee_job_history / employee_compensation_history / employee_documents.
// ─────────────────────────────────────────────────────────────────────────

// Manager-cycle guard: walks up the proposed manager's chain and rejects if
// `employeeId` would become its own ancestor. Bounded depth avoids an
// infinite loop if bad data already has a cycle. Deliberately reads outside
// the caller's in-flight transaction — it's validating against the graph as
// it exists right now, not against this update's own not-yet-committed change.
const MAX_MANAGER_CHAIN_DEPTH = 20;
export async function assertNoManagerCycle(employeeId: number | string, proposedManagerId: number | string | null | undefined) {
  if (proposedManagerId == null) return;
  if (Number(proposedManagerId) === Number(employeeId)) {
    throwStatus('An employee cannot be their own manager', 400);
  }
  let currentId: number | string = proposedManagerId;
  for (let depth = 0; depth < MAX_MANAGER_CHAIN_DEPTH; depth++) {
    const row = await Employee.findByPk(currentId, { attributes: ['manager_id'] });
    const nextManagerId = row?.get('manager_id') as number | null | undefined;
    if (nextManagerId == null) return; // reached the top of the chain, no cycle
    if (Number(nextManagerId) === Number(employeeId)) {
      throwStatus('This manager change would create a reporting cycle', 400);
    }
    currentId = nextManagerId;
  }
  // Chain exceeded the bound — likely pre-existing bad data; don't block the
  // write on it, but this is worth surfacing in logs.
  console.warn(`assertNoManagerCycle: manager chain from ${proposedManagerId} exceeded depth ${MAX_MANAGER_CHAIN_DEPTH}`);
}

// IMPORTANT: pass `role: undefined`/omit it when the caller isn't changing
// role (e.g. a password-only update) — it must reach this function as
// undefined/null, NOT pre-defaulted to 'employee' in JS, or the COALESCE
// below never fires and an unrelated write silently resets an existing
// admin/lead back to 'employee'. Only a genuinely new employee_auth row
// (INSERT branch) falls back to 'employee', via SQL's own IFNULL. Kept as a
// raw upsert (not Model.upsert) to preserve that exact COALESCE-on-conflict
// semantics, which Sequelize's upsert() can't express.
export async function upsertAuth(
  employeeId: number | string,
  { password_hash, role }: { password_hash?: string | null; role?: string | null },
  transaction?: Transaction,
  actorId: number | null = null
) {
  await sequelize.query(
    `INSERT INTO employee_auth (employee_id, password_hash, role, created_by, updated_by)
     VALUES (:employeeId, :password_hash, IFNULL(:role, 'employee'), :actorId, :actorId)
     ON DUPLICATE KEY UPDATE
       password_hash = COALESCE(VALUES(password_hash), password_hash),
       role = COALESCE(:role2, role),
       updated_by = :actorId`,
    {
      replacements: {
        employeeId,
        password_hash: password_hash ?? null,
        role: role ?? null,
        role2: role ?? null,
        actorId,
      },
      type: QueryTypes.INSERT,
      transaction,
    }
  );
}

const PROFILE_COLUMNS = [
  'phone', 'alt_phone', 'discord_username', 'emergency_contact', 'dob', 'bio', 'address',
  'timezone', 'work_hours', 'leave_policy_accepted', 'leave_policy_accepted_at',
];
export async function upsertProfile(
  employeeId: number | string,
  fields: Record<string, any>,
  transaction?: Transaction,
  actorId: number | null = null
) {
  const present = PROFILE_COLUMNS.filter((f) => fields[f] !== undefined);
  if (!present.length) return;

  const insertCols = ['employee_id', ...present, 'created_by', 'updated_by'];
  const insertPlaceholders = insertCols.map((c) => `:${c}`).join(', ');
  const updateClause = present.map((f) => `${f} = VALUES(${f})`).join(', ') + ', updated_by = :updated_by';
  const replacements: Record<string, any> = { employee_id: employeeId, created_by: actorId, updated_by: actorId };
  for (const f of present) replacements[f] = fields[f];

  await sequelize.query(
    `INSERT INTO employee_profile (${insertCols.join(', ')}) VALUES (${insertPlaceholders})
     ON DUPLICATE KEY UPDATE ${updateClause}`,
    { replacements, type: QueryTypes.INSERT, transaction }
  );
}

// Closes out the current job_history row (if any) and inserts a new one.
// Only call this when designation/department/manager actually changed.
export async function recordJobChange(
  employeeId: number | string,
  { designationId, departmentId, managerId, changeReason, changedBy }: any,
  transaction?: Transaction
) {
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  await EmployeeJobHistory.update(
    { effective_to: effectiveFrom },
    { where: { employee_id: employeeId, effective_to: null }, transaction }
  );
  await EmployeeJobHistory.create(
    {
      employee_id: employeeId,
      designation_id: designationId ?? null,
      department_id: departmentId ?? null,
      manager_id: managerId ?? null,
      effective_from: effectiveFrom,
      change_reason: changeReason ?? null,
      changed_by: changedBy ?? null,
      created_at: new Date(),
    } as any,
    { transaction }
  );
}

// Closes out the current compensation_history row (if any) and inserts a new one.
export async function recordCompensationChange(
  employeeId: number | string,
  { salary, payFrequency, changeReason, changedBy }: any,
  transaction?: Transaction
) {
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  await EmployeeCompensationHistory.update(
    { effective_to: effectiveFrom },
    { where: { employee_id: employeeId, effective_to: null }, transaction }
  );
  await EmployeeCompensationHistory.create(
    {
      employee_id: employeeId,
      salary,
      pay_frequency: payFrequency ?? 'monthly',
      effective_from: effectiveFrom,
      change_reason: changeReason ?? null,
      changed_by: changedBy ?? null,
      created_at: new Date(),
    } as any,
    { transaction }
  );
}

// Marks any existing current document of this type as superseded, then inserts
// the new one — keeps prior versions with is_current=FALSE as free history.
export async function recordDocumentUpload(
  employeeId: number | string,
  docType: string,
  filename: string,
  uploadedBy?: number | string | null,
  transaction?: Transaction
) {
  await EmployeeDocument.update(
    { is_current: false },
    { where: { employee_id: employeeId, doc_type: docType, is_current: true }, transaction }
  );
  await EmployeeDocument.create(
    {
      employee_id: employeeId,
      doc_type: docType,
      filename,
      uploaded_by: uploadedBy ?? null,
      uploaded_at: new Date(),
      is_current: true,
    } as any,
    { transaction }
  );
}
