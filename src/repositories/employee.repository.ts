import { eq, and, sql, getViewSelectedFields } from 'drizzle-orm';
import { alias, mysqlTable, int, varchar, date } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import {
  employees,
  employeeJobHistory,
  employeeCompensationHistory,
  employeeDocuments,
  departments,
  designations,
  employeesFlat,
} from '../models';
import type { EmployeeCreateInput, EmployeeUpdateInput } from '../dtos/employee.dto';

// Same exported function names/signatures as the old src/models/Employee.js —
// every other domain's controller/service that does
// `require('../models/Employee')` now points at this file instead (see the
// grep-bounded list of call sites in the migration plan) and keeps working
// unmodified. New callers (employee.service.ts) additionally pass an
// `actorId` (from req.user.id) so writes populate created_by/updated_by —
// existing callers that omit it simply leave those columns null, same as
// they do today by never setting them at all.

type Db = typeof db;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

function throwStatus(message: string, status: number): never {
  const err: any = new Error(message);
  err.status = status;
  throw err;
}

// The mysql2 driver's `db.insert(table).values(...)` resolves to the raw
// `[ResultSetHeader, FieldPacket[]]` tuple mysql2 itself returns — NOT a
// plain ResultSetHeader — so the inserted id is `result[0].insertId`, not
// `result.insertId`.
function insertedId(result: any): number {
  return result[0].insertId as number;
}

const manager = alias(employeesFlat, 'manager');

// employees_flat rows come back with every column plus a joined `manager_name`
// (via a self-join alias) — same flat shape the old hand-written
// `LEFT JOIN employees_flat m` query returned.
const flatWithManager = { ...getViewSelectedFields(employeesFlat), manager_name: manager.name };

// Minimal, read-only view of `leave_requests` — a table owned by the (not yet
// converted) Leave domain. Only the columns findApprovedLeaveRangesForEmployee
// actually reads are declared; safe because this is never used to write.
const leaveRequests = mysqlTable('leave_requests', {
  employee_id: int('employee_id'),
  status: varchar('status', { length: 20 }),
  start_date: date('start_date', { mode: 'string' }),
  end_date: date('end_date', { mode: 'string' }),
});

export async function findAllActive() {
  return db
    .select(flatWithManager)
    .from(employeesFlat)
    .leftJoin(manager, eq(employeesFlat.manager_id, manager.id))
    .where(eq(employeesFlat.is_active, true))
    .orderBy(employeesFlat.name);
}

export async function findById(id: number | string) {
  const rows = await db
    .select(flatWithManager)
    .from(employeesFlat)
    .leftJoin(manager, eq(employeesFlat.manager_id, manager.id))
    .where(eq(employeesFlat.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function findByEmail(email: string) {
  const rows = await db.select().from(employeesFlat).where(eq(employeesFlat.email, email)).limit(1);
  return rows[0] || null;
}

export async function findBySecondaryEmail(email: string) {
  const rows = await db.select().from(employeesFlat).where(eq(employeesFlat.secondary_email, email)).limit(1);
  return rows[0] || null;
}

export async function findAuthByEmail(email: string) {
  const rows = await db
    .select({
      id: employeesFlat.id,
      name: employeesFlat.name,
      email: employeesFlat.email,
      role: employeesFlat.role,
      designation: employeesFlat.designation,
      department: employeesFlat.department,
      password_hash: employeesFlat.password_hash,
    })
    .from(employeesFlat)
    .where(and(eq(employeesFlat.email, email), eq(employeesFlat.is_active, true)))
    .limit(1);
  return rows[0] || null;
}

export async function findActiveBasicByEmail(email: string) {
  const rows = await db
    .select({ id: employeesFlat.id, name: employeesFlat.name })
    .from(employeesFlat)
    .where(and(eq(employeesFlat.email, email), eq(employeesFlat.is_active, true)))
    .limit(1);
  return rows[0] || null;
}

export async function findPasswordHashById(id: number | string) {
  const rows = await db
    .select({ password_hash: employeesFlat.password_hash })
    .from(employeesFlat)
    .where(eq(employeesFlat.id, Number(id)))
    .limit(1);
  return rows[0]?.password_hash || null;
}

export async function updatePasswordHash(id: number | string, hash: string) {
  await upsertAuth(id, { password_hash: hash });
}

export async function findNameById(id: number | string) {
  const rows = await db
    .select({ name: employees.name })
    .from(employees)
    .where(eq(employees.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function findByDiscordUsername(discordUsername: string) {
  const rows = await db
    .select({ id: employeesFlat.id, name: employeesFlat.name })
    .from(employeesFlat)
    .where(eq(employeesFlat.discord_username, discordUsername))
    .limit(1);
  return rows[0] || null;
}

// `pattern` arrives pre-wrapped with SQL LIKE wildcards (e.g. `%bob%`) from
// callers — same contract as the original.
export async function findByNameLike(pattern: string) {
  const rows = await db
    .select({ id: employees.id, name: employees.name })
    .from(employees)
    .where(sql`LOWER(${employees.name}) LIKE LOWER(${pattern})`)
    .limit(1);
  return rows[0] || null;
}

// Resolves free-text department/designation to their lookup-table id, creating
// the lookup row on first use if it doesn't exist yet.
async function findOrCreateDepartmentId(name: string | null | undefined, tx: Tx) {
  if (!name) return null;
  const existing = await tx.select({ id: departments.id }).from(departments).where(eq(departments.name, name)).limit(1);
  if (existing[0]) return existing[0].id;
  const result = await tx.insert(departments).values({ name, is_active: true, created_at: new Date() });
  return insertedId(result);
}

async function findOrCreateDesignationId(title: string | null | undefined, tx: Tx) {
  if (!title) return null;
  const existing = await tx.select({ id: designations.id }).from(designations).where(eq(designations.title, title)).limit(1);
  if (existing[0]) return existing[0].id;
  const result = await tx.insert(designations).values({ title, is_active: true, created_at: new Date() });
  return insertedId(result);
}

export async function create(data: EmployeeCreateInput, actorId: number | null = null) {
  if (data.manager_id != null && Number(data.manager_id) < 1) {
    throwStatus('Invalid manager_id', 400);
  }
  // A brand-new employee has no id yet, so it can't already be an ancestor of
  // the proposed manager — no cycle check needed here, unlike update().

  return db.transaction(async (tx) => {
    const departmentId = await findOrCreateDepartmentId(data.department, tx);
    const designationId = await findOrCreateDesignationId(data.designation, tx);
    const effectiveFrom = data.start_date || new Date().toISOString().slice(0, 10);

    const result = await tx.insert(employees).values({
      name: data.name,
      email: data.email,
      secondary_email: data.secondary_email ?? null,
      manager_id: data.manager_id ?? null,
      start_date: data.start_date ?? null,
      tech_stack: data.tech_stack,
      // Not settable at creation — EmployeeCreateInput has no qualifications
      // field; it's only ever written later via the profile-update endpoint.
      qualifications: [],
      designation_id: designationId,
      department_id: departmentId,
      created_by: actorId,
      updated_by: actorId,
      created_at: new Date(),
    });
    const employeeId = insertedId(result);

    await upsertAuth(employeeId, { password_hash: null, role: data.role }, tx, actorId);
    await upsertProfile(
      employeeId,
      {
        phone: data.phone,
        emergency_contact: data.emergency_contact,
        timezone: data.timezone,
        work_hours: data.work_hours,
      },
      tx,
      actorId
    );

    await tx.insert(employeeJobHistory).values({
      employee_id: employeeId,
      designation_id: designationId,
      department_id: departmentId,
      manager_id: data.manager_id ?? null,
      effective_from: effectiveFrom,
      change_reason: 'hire',
      created_at: new Date(),
    });

    return employeeId;
  });
}

export async function seedLeaveBalances(employeeId: number | string, year: number) {
  await db.execute(sql`
    INSERT INTO leave_balances (employee_id, leave_type, total, taken, year) VALUES
     (${employeeId}, 'sick', 12, 0, ${year}),
     (${employeeId}, 'bereavement', 3, 0, ${year}),
     (${employeeId}, 'maternity', 60, 0, ${year}),
     (${employeeId}, 'paternity', 30, 0, ${year})
  `);
}

// Fields that live on employee_auth / employee_profile post-Phase-5.
// Anything not listed here (name, email, secondary_email, tech_stack,
// qualifications) is one of the few columns still physically on `employees`.
const PROFILE_UPDATE_FIELDS = [
  'phone', 'alt_phone', 'discord_username', 'emergency_contact', 'dob', 'bio', 'address',
  'timezone', 'work_hours', 'leave_policy_accepted', 'leave_policy_accepted_at',
];
const EMPLOYEES_TABLE_FIELDS = ['name', 'email', 'secondary_email', 'tech_stack', 'qualifications', 'manager_id', 'start_date'];

export async function update(id: number | string, updates: EmployeeUpdateInput, actorId: number | null = null) {
  const fields = Object.keys(updates);
  if (!fields.length) return;
  const employeeId = Number(id);

  await db.transaction(async (tx) => {
    const employeesFields = fields.filter((f) => EMPLOYEES_TABLE_FIELDS.includes(f));
    if (employeesFields.length) {
      const setValues: Record<string, any> = { updated_by: actorId };
      for (const f of employeesFields) setValues[f] = updates[f];
      await tx.update(employees).set(setValues).where(eq(employees.id, employeeId));
    }

    // password_hash is deliberately not part of EmployeeUpdateInput — password
    // changes go through auth.service.ts (changePassword/resetPassword ->
    // updatePasswordHash), not this general-purpose employee update.
    if (fields.includes('role')) {
      await upsertAuth(employeeId, { role: updates.role }, tx, actorId);
    }

    const profileUpdates: Record<string, any> = {};
    for (const f of PROFILE_UPDATE_FIELDS) {
      if (updates[f] !== undefined) profileUpdates[f] = updates[f];
    }
    if (Object.keys(profileUpdates).length) {
      await upsertProfile(employeeId, profileUpdates, tx, actorId);
    }

    // designation/department/manager_id changing means a job-history event —
    // only record one if at least one of the three was actually part of this update.
    if (['designation', 'department', 'manager_id'].some((f) => fields.includes(f))) {
      if (fields.includes('manager_id')) {
        await assertNoManagerCycle(employeeId, updates.manager_id);
      }
      const currentRows = await tx
        .select({ designation_id: employees.designation_id, department_id: employees.department_id, manager_id: employees.manager_id })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);
      const current = currentRows[0];
      const departmentId = fields.includes('department')
        ? await findOrCreateDepartmentId(updates.department, tx)
        : current?.department_id;
      const designationId = fields.includes('designation')
        ? await findOrCreateDesignationId(updates.designation, tx)
        : current?.designation_id;
      const managerId = fields.includes('manager_id') ? updates.manager_id : current?.manager_id;

      await recordJobChange(employeeId, { designationId, departmentId, managerId, changeReason: 'update' }, tx);
      await tx
        .update(employees)
        .set({ designation_id: designationId, department_id: departmentId, updated_by: actorId })
        .where(eq(employees.id, employeeId));
    }
  });
}

export async function deactivate(id: number | string, actorId: number | null = null) {
  // status kept in sync with is_active, same as the Phase 1 backfill did —
  // every existing `WHERE is_active = TRUE` query keeps working unmodified.
  await db
    .update(employees)
    .set({ is_active: false, status: 'terminated', updated_by: actorId })
    .where(eq(employees.id, Number(id)));
}

export async function findPayrollBaseById(id: number | string) {
  const rows = await db
    .select({
      id: employeesFlat.id,
      name: employeesFlat.name,
      designation: employeesFlat.designation,
      department: employeesFlat.department,
      salary: employeesFlat.salary,
      pay_frequency: employeesFlat.pay_frequency,
      start_date: employeesFlat.start_date,
    })
    .from(employeesFlat)
    .where(and(eq(employeesFlat.id, Number(id)), eq(employeesFlat.is_active, true)))
    .limit(1);
  return rows[0] || null;
}

// id === null/undefined => all active employees; otherwise just that employee's row.
export async function findPayrollColumns(id: number | string | null) {
  const cols = {
    id: employeesFlat.id,
    name: employeesFlat.name,
    designation: employeesFlat.designation,
    department: employeesFlat.department,
    role: employeesFlat.role,
    salary: employeesFlat.salary,
    pay_frequency: employeesFlat.pay_frequency,
  };
  const where = id
    ? and(eq(employeesFlat.is_active, true), eq(employeesFlat.id, Number(id)))
    : eq(employeesFlat.is_active, true);
  return db.select(cols).from(employeesFlat).where(where).orderBy(employeesFlat.name);
}

export async function updateSalary(id: number | string, salary: number | null, payFrequency: string | null, actorId: number | null = null) {
  // A null salary (payroll UI allows clearing it) has nothing to record as a
  // compensation-history event — just close out the current row, if any.
  if (salary == null) {
    await db.execute(sql`
      UPDATE employee_compensation_history SET effective_to = CURDATE()
      WHERE employee_id = ${id} AND effective_to IS NULL
    `);
  } else {
    await recordCompensationChange(id, { salary, payFrequency, changeReason: 'salary_update', changedBy: actorId });
  }
}

const PROFILE_FIELDS = {
  id: employeesFlat.id,
  name: employeesFlat.name,
  email: employeesFlat.email,
  phone: employeesFlat.phone,
  alt_phone: employeesFlat.alt_phone,
  emergency_contact: employeesFlat.emergency_contact,
  designation: employeesFlat.designation,
  department: employeesFlat.department,
  dob: employeesFlat.dob,
  bio: employeesFlat.bio,
  address: employeesFlat.address,
  qualifications: employeesFlat.qualifications,
  profile_picture: employeesFlat.profile_picture,
  citizenship_front: employeesFlat.citizenship_front,
  citizenship_back: employeesFlat.citizenship_back,
  timezone: employeesFlat.timezone,
  work_hours: employeesFlat.work_hours,
  tech_stack: employeesFlat.tech_stack,
  role: employeesFlat.role,
  start_date: employeesFlat.start_date,
  leave_policy_accepted: employeesFlat.leave_policy_accepted,
  leave_policy_accepted_at: employeesFlat.leave_policy_accepted_at,
};

export async function findProfileById(id: number | string) {
  const rows = await db
    .select(PROFILE_FIELDS)
    .from(employeesFlat)
    .where(and(eq(employeesFlat.id, Number(id)), eq(employeesFlat.is_active, true)))
    .limit(1);
  return rows[0] || null;
}

export async function findProfilePictureById(id: number | string) {
  const rows = await db
    .select({ profile_picture: employeesFlat.profile_picture })
    .from(employeesFlat)
    .where(eq(employeesFlat.id, Number(id)))
    .limit(1);
  return rows[0]?.profile_picture || null;
}

export async function updateProfilePicture(id: number | string, filename: string) {
  await recordDocumentUpload(id, 'profile_picture', filename, id);
}

// column must be a trusted literal ('citizenship_front' | 'citizenship_back'), never raw user input
const CITIZENSHIP_COLUMNS = { citizenship_front: employeesFlat.citizenship_front, citizenship_back: employeesFlat.citizenship_back } as const;
export async function findCitizenshipDocById(id: number | string, column: string) {
  const col = CITIZENSHIP_COLUMNS[column as keyof typeof CITIZENSHIP_COLUMNS];
  if (!col) throwStatus('Invalid document column', 400);
  const rows = await db.select({ value: col }).from(employeesFlat).where(eq(employeesFlat.id, Number(id))).limit(1);
  return rows[0]?.value || null;
}

export async function updateCitizenshipDoc(id: number | string, column: string, filename: string) {
  await recordDocumentUpload(id, column, filename, id);
}

export async function acceptLeavePolicy(id: number | string) {
  await upsertProfile(id, { leave_policy_accepted: true, leave_policy_accepted_at: new Date() });
}

export async function findApprovedLeaveRangesForEmployee(id: number | string, rangeStart: string, rangeEnd: string) {
  return db
    .select({ start_date: leaveRequests.start_date, end_date: leaveRequests.end_date })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employee_id, Number(id)),
        eq(leaveRequests.status, 'approved'),
        sql`${leaveRequests.start_date} <= ${rangeEnd}`,
        sql`${leaveRequests.end_date} >= ${rangeStart}`
      )
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
  let currentId: number = Number(proposedManagerId);
  for (let depth = 0; depth < MAX_MANAGER_CHAIN_DEPTH; depth++) {
    const rows = await db.select({ manager_id: employees.manager_id }).from(employees).where(eq(employees.id, currentId)).limit(1);
    const nextManagerId = rows[0]?.manager_id;
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
// raw upsert (not Drizzle's .onDuplicateKeyUpdate()) to preserve that exact
// COALESCE-on-conflict semantics, which Drizzle's upsert can't express.
export async function upsertAuth(
  employeeId: number | string,
  { password_hash, role }: { password_hash?: string | null; role?: string | null },
  tx: Tx | Db = db,
  actorId: number | null = null
) {
  await tx.execute(sql`
    INSERT INTO employee_auth (employee_id, password_hash, role, created_by, updated_by)
    VALUES (${Number(employeeId)}, ${password_hash ?? null}, IFNULL(${role ?? null}, 'employee'), ${actorId}, ${actorId})
    ON DUPLICATE KEY UPDATE
      password_hash = COALESCE(VALUES(password_hash), password_hash),
      role = COALESCE(${role ?? null}, role),
      updated_by = ${actorId}
  `);
}

const PROFILE_COLUMNS = [
  'phone', 'alt_phone', 'discord_username', 'emergency_contact', 'dob', 'bio', 'address',
  'timezone', 'work_hours', 'leave_policy_accepted', 'leave_policy_accepted_at',
];
export async function upsertProfile(
  employeeId: number | string,
  fields: Record<string, any>,
  tx: Tx | Db = db,
  actorId: number | null = null
) {
  const present = PROFILE_COLUMNS.filter((f) => fields[f] !== undefined);
  if (!present.length) return;

  const insertCols = ['employee_id', ...present, 'created_by', 'updated_by'];
  const insertVals = [Number(employeeId), ...present.map((f) => fields[f]), actorId, actorId];
  const updateClause = sql.join(
    [...present.map((f) => sql.raw(`${f} = VALUES(${f})`)), sql`updated_by = ${actorId}`],
    sql`, `
  );

  await tx.execute(sql`
    INSERT INTO employee_profile (${sql.raw(insertCols.join(', '))})
    VALUES (${sql.join(insertVals.map((v) => sql`${v}`), sql`, `)})
    ON DUPLICATE KEY UPDATE ${updateClause}
  `);
}

// Closes out the current job_history row (if any) and inserts a new one.
// Only call this when designation/department/manager actually changed.
export async function recordJobChange(
  employeeId: number | string,
  { designationId, departmentId, managerId, changeReason, changedBy }: any,
  tx: Tx | Db = db
) {
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  await tx
    .update(employeeJobHistory)
    .set({ effective_to: effectiveFrom })
    .where(and(eq(employeeJobHistory.employee_id, Number(employeeId)), sql`${employeeJobHistory.effective_to} IS NULL`));
  await tx.insert(employeeJobHistory).values({
    employee_id: Number(employeeId),
    designation_id: designationId ?? null,
    department_id: departmentId ?? null,
    manager_id: managerId ?? null,
    effective_from: effectiveFrom,
    change_reason: changeReason ?? null,
    changed_by: changedBy ?? null,
    created_at: new Date(),
  });
}

// Closes out the current compensation_history row (if any) and inserts a new one.
export async function recordCompensationChange(
  employeeId: number | string,
  { salary, payFrequency, changeReason, changedBy }: any,
  tx: Tx | Db = db
) {
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  await tx
    .update(employeeCompensationHistory)
    .set({ effective_to: effectiveFrom })
    .where(and(eq(employeeCompensationHistory.employee_id, Number(employeeId)), sql`${employeeCompensationHistory.effective_to} IS NULL`));
  await tx.insert(employeeCompensationHistory).values({
    employee_id: Number(employeeId),
    salary: String(salary),
    pay_frequency: (payFrequency ?? 'monthly') as 'monthly' | 'biweekly' | 'weekly',
    effective_from: effectiveFrom,
    change_reason: changeReason ?? null,
    changed_by: changedBy ?? null,
    created_at: new Date(),
  });
}

// Marks any existing current document of this type as superseded, then inserts
// the new one — keeps prior versions with is_current=FALSE as free history.
export async function recordDocumentUpload(
  employeeId: number | string,
  docType: string,
  filename: string,
  uploadedBy?: number | string | null,
  tx: Tx | Db = db
) {
  await tx
    .update(employeeDocuments)
    .set({ is_current: false })
    .where(
      and(
        eq(employeeDocuments.employee_id, Number(employeeId)),
        eq(employeeDocuments.doc_type, docType as any),
        eq(employeeDocuments.is_current, true)
      )
    );
  await tx.insert(employeeDocuments).values({
    employee_id: Number(employeeId),
    doc_type: docType as any,
    filename,
    uploaded_by: uploadedBy ? Number(uploadedBy) : null,
    uploaded_at: new Date(),
    is_current: true,
  });
}
