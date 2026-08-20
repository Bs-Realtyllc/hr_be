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

type Db = typeof db;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

function throwStatus(message: string, status: number): never {
  const err: any = new Error(message);
  err.status = status;
  throw err;
}

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const manager = alias(employeesFlat, 'manager');

const flatWithManager = { ...getViewSelectedFields(employeesFlat), manager_name: manager.name };

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

export async function findAllOnboarding() {
  return db
    .select(flatWithManager)
    .from(employeesFlat)
    .leftJoin(manager, eq(employeesFlat.manager_id, manager.id))
    .where(eq(employeesFlat.status, 'onboarding'))
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

export async function findAuthById(id: number) {
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
    .where(and(eq(employeesFlat.id, id), eq(employeesFlat.is_active, true)))
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

export async function findByNameLike(pattern: string) {
  const rows = await db
    .select({ id: employees.id, name: employees.name })
    .from(employees)
    .where(sql`LOWER(${employees.name}) LIKE LOWER(${pattern})`)
    .limit(1);
  return rows[0] || null;
}

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
      qualifications: [],
      designation_id: designationId,
      department_id: departmentId,
      is_active: data.status !== 'onboarding',
      status: data.status,
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
        emergency_contact_name: data.emergency_contact_name,
        timezone: data.timezone,
        work_hours: data.work_hours,
        gender: data.gender,
        permanent_address: data.permanent_address,
        education_level: data.education_level,
        institution_name: data.institution_name,
        field_of_study: data.field_of_study,
        graduation_date: data.graduation_date,
        previous_experience: data.previous_experience,
        areas_of_interest: data.areas_of_interest,
        linkedin_url: data.linkedin_url,
        github_url: data.github_url,
        portfolio_url: data.portfolio_url,
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

const PROFILE_UPDATE_FIELDS = [
  'phone', 'alt_phone', 'discord_username', 'emergency_contact', 'emergency_contact_name', 'dob', 'gender',
  'bio', 'address', 'permanent_address', 'education_level', 'institution_name', 'field_of_study',
  'graduation_date', 'previous_experience', 'areas_of_interest', 'linkedin_url', 'github_url', 'portfolio_url',
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
  await db
    .update(employees)
    .set({ is_active: false, status: 'terminated', updated_by: actorId })
    .where(eq(employees.id, Number(id)));
}

export async function approve(id: number | string, passwordHash: string, actorId: number | null = null) {
  await db.transaction(async (tx) => {
    await tx
      .update(employees)
      .set({ is_active: true, status: 'active', updated_by: actorId })
      .where(eq(employees.id, Number(id)));
    await upsertAuth(id, { password_hash: passwordHash }, tx, actorId);
  });
}

export async function reject(id: number | string) {
  await db.delete(employees).where(eq(employees.id, Number(id)));
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
    if (nextManagerId == null) return;
    if (Number(nextManagerId) === Number(employeeId)) {
      throwStatus('This manager change would create a reporting cycle', 400);
    }
    currentId = nextManagerId;
  }
  console.warn(`assertNoManagerCycle: manager chain from ${proposedManagerId} exceeded depth ${MAX_MANAGER_CHAIN_DEPTH}`);
}

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
  'phone', 'alt_phone', 'discord_username', 'emergency_contact', 'emergency_contact_name', 'dob', 'gender',
  'bio', 'address', 'permanent_address', 'education_level', 'institution_name', 'field_of_study',
  'graduation_date', 'previous_experience', 'areas_of_interest', 'linkedin_url', 'github_url', 'portfolio_url',
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

export async function findCompensationHistory(employeeId: number | string) {
  const actor = alias(employees, 'actor');
  return db
    .select({
      id: employeeCompensationHistory.id,
      employee_id: employeeCompensationHistory.employee_id,
      salary: employeeCompensationHistory.salary,
      pay_frequency: employeeCompensationHistory.pay_frequency,
      effective_from: employeeCompensationHistory.effective_from,
      effective_to: employeeCompensationHistory.effective_to,
      change_reason: employeeCompensationHistory.change_reason,
      changed_by: employeeCompensationHistory.changed_by,
      changed_by_name: actor.name,
      created_at: employeeCompensationHistory.created_at,
    })
    .from(employeeCompensationHistory)
    .leftJoin(actor, eq(employeeCompensationHistory.changed_by, actor.id))
    .where(eq(employeeCompensationHistory.employee_id, Number(employeeId)))
    .orderBy(sql`${employeeCompensationHistory.effective_from} DESC`, sql`${employeeCompensationHistory.id} DESC`);
}

