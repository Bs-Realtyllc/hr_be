import { eq, and, sql } from 'drizzle-orm';
import { alias, mysqlTable, int, varchar, date } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import {
  employees,
  employeeCompensationHistory,
  employeeDocuments,
  departments,
  designations,
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

const manager = alias(employees, 'manager');
const docPic = alias(employeeDocuments, 'doc_pic');
const docCf = alias(employeeDocuments, 'doc_cf');
const docCb = alias(employeeDocuments, 'doc_cb');

const ACTIVE_ROSTER = sql`${employees.status} NOT IN ('onboarding', 'terminated')`;

const BASE_COLUMNS = {
  id: employees.id,
  name: employees.name,
  email: employees.email,
  secondary_email: employees.secondary_email,
  designation_id: employees.designation_id,
  designation: designations.title,
  department_id: employees.department_id,
  department: departments.name,
  manager_id: employees.manager_id,
  start_date: employees.start_date,
  dob: employees.dob,
  gender: employees.gender,
  github_url: employees.github_url,
  address: employees.address,
  discord_username: employees.discord_username,
  panNo: employees.panNo,
  role: employees.role,
  password_hash: employees.password_hash,
  status: employees.status,
  profile_picture: docPic.filename,
  citizenship_front: docCf.filename,
  citizenship_back: docCb.filename,
};

function withDocJoins<T extends { leftJoin: any }>(query: T): T {
  return query
    .leftJoin(docPic, and(eq(docPic.emp_id, employees.id), eq(docPic.name, 'profile_picture')))
    .leftJoin(docCf, and(eq(docCf.emp_id, employees.id), eq(docCf.name, 'citizenship_front')))
    .leftJoin(docCb, and(eq(docCb.emp_id, employees.id), eq(docCb.name, 'citizenship_back')));
}

function baseQuery() {
  return withDocJoins(
    db
      .select(BASE_COLUMNS)
      .from(employees)
      .leftJoin(designations, eq(employees.designation_id, designations.id))
      .leftJoin(departments, eq(employees.department_id, departments.id)) as any
  );
}

function baseQueryWithManager() {
  return withDocJoins(
    db
      .select({ ...BASE_COLUMNS, manager_name: manager.name })
      .from(employees)
      .leftJoin(designations, eq(employees.designation_id, designations.id))
      .leftJoin(departments, eq(employees.department_id, departments.id))
      .leftJoin(manager, eq(employees.manager_id, manager.id)) as any
  );
}

const leaveRequests = mysqlTable('leave_requests', {
  employee_id: int('employee_id'),
  status: varchar('status', { length: 20 }),
  start_date: date('start_date', { mode: 'string' }),
  end_date: date('end_date', { mode: 'string' }),
});

export async function findAllActive() {
  return baseQueryWithManager().where(ACTIVE_ROSTER).orderBy(employees.name);
}

export async function findAllOnboarding() {
  return baseQueryWithManager().where(eq(employees.status, 'onboarding')).orderBy(employees.name);
}

export async function findById(id: number | string) {
  const rows = await baseQueryWithManager().where(eq(employees.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function findByEmail(email: string) {
  const rows = await baseQuery().where(eq(employees.email, email)).limit(1);
  return rows[0] || null;
}

export async function findBySecondaryEmail(email: string) {
  const rows = await baseQuery().where(eq(employees.secondary_email, email)).limit(1);
  return rows[0] || null;
}

export async function findAuthByEmail(email: string) {
  const rows = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      role: employees.role,
      designation: designations.title,
      department: departments.name,
      password_hash: employees.password_hash,
    })
    .from(employees)
    .leftJoin(designations, eq(employees.designation_id, designations.id))
    .leftJoin(departments, eq(employees.department_id, departments.id))
    .where(and(eq(employees.email, email), ACTIVE_ROSTER))
    .limit(1);
  return rows[0] || null;
}

export async function findAuthById(id: number) {
  const rows = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      role: employees.role,
      designation: employees.designation,
      department: employees.department,
      password_hash: employees.password_hash,
    })
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.is_active, true)))
    .limit(1);
  return rows[0] || null;
}


export async function findActiveBasicByEmail(email: string) {
  const rows = await db
    .select({ id: employees.id, name: employees.name })
    .from(employees)
    .where(and(eq(employees.email, email), ACTIVE_ROSTER))
    .limit(1);
  return rows[0] || null;
}

export async function findPasswordHashById(id: number | string) {
  const rows = await db
    .select({ password_hash: employees.password_hash })
    .from(employees)
    .where(eq(employees.id, Number(id)))
    .limit(1);
  return rows[0]?.password_hash || null;
}

export async function updatePasswordHash(id: number | string, hash: string) {
  await db.update(employees).set({ password_hash: hash }).where(eq(employees.id, Number(id)));
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
    .select({ id: employees.id, name: employees.name })
    .from(employees)
    .where(eq(employees.discord_username, discordUsername))
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

const ONBOARDING_PROFILE_FIELDS = [
  'education_level',
  'institution_name',
  'field_of_study',
  'graduation_date',
  'previous_experience',
  'areas_of_interest',
  'linkedin_url',
  'portfolio_url',
] as const;

async function upsertOnboardingProfile(employeeId: number | string, fields: Record<string, any>, tx: Tx | Db = db) {
  const present = ONBOARDING_PROFILE_FIELDS.filter((f) => fields[f] !== undefined);
  if (!present.length) return;

  const insertCols = ['employee_id', ...present];
  const insertVals = [Number(employeeId), ...present.map((f) => fields[f])];
  const updateClause = sql.join(
    present.map((f) => sql.raw(`${f} = VALUES(${f})`)),
    sql`, `
  );

  await tx.execute(sql`
    INSERT INTO employee_onboarding_profile (${sql.raw(insertCols.join(', '))})
    VALUES (${sql.join(insertVals.map((v) => sql`${v}`), sql`, `)})
    ON DUPLICATE KEY UPDATE ${updateClause}
  `);
}

export async function create(data: EmployeeCreateInput, actorId: number | null = null) {
  if (data.manager_id != null && Number(data.manager_id) < 1) {
    throwStatus('Invalid manager_id', 400);
  }

  return db.transaction(async (tx) => {
    const departmentId = await findOrCreateDepartmentId(data.department, tx);
    const designationId = await findOrCreateDesignationId(data.designation, tx);

    const result = await tx.insert(employees).values({
      name: data.name,
      email: data.email,
      secondary_email: data.secondary_email ?? null,
      manager_id: data.manager_id ?? null,
      start_date: data.start_date ?? null,
      designation_id: designationId,
      department_id: departmentId,
      status: data.status,
      role: data.role || 'employee',
      gender: data.gender ?? null,
      github_url: data.github_url ?? null,
    });
    const employeeId = insertedId(result);

    await upsertOnboardingProfile(employeeId, data, tx);

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

const EMPLOYEES_TABLE_FIELDS = [
  'name',
  'email',
  'secondary_email',
  'manager_id',
  'start_date',
  'dob',
  'gender',
  'github_url',
  'address',
  'discord_username',
  'panNo',
  'role',
];

export async function update(id: number | string, updates: EmployeeUpdateInput, actorId: number | null = null) {
  const fields = Object.keys(updates);
  if (!fields.length) return;
  const employeeId = Number(id);

  await db.transaction(async (tx) => {
    const employeesFields = fields.filter((f) => EMPLOYEES_TABLE_FIELDS.includes(f));

    if (['designation', 'department', 'manager_id'].some((f) => fields.includes(f))) {
      if (fields.includes('manager_id')) {
        await assertNoManagerCycle(employeeId, (updates as any).manager_id);
      }
      const currentRows = await tx
        .select({ designation_id: employees.designation_id, department_id: employees.department_id })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);
      const current = currentRows[0];
      const departmentId = fields.includes('department')
        ? await findOrCreateDepartmentId((updates as any).department, tx)
        : current?.department_id;
      const designationId = fields.includes('designation')
        ? await findOrCreateDesignationId((updates as any).designation, tx)
        : current?.designation_id;

      const setValues: Record<string, any> = { designation_id: designationId, department_id: departmentId };
      for (const f of employeesFields) setValues[f] = (updates as any)[f];
      await tx.update(employees).set(setValues).where(eq(employees.id, employeeId));
    } else if (employeesFields.length) {
      const setValues: Record<string, any> = {};
      for (const f of employeesFields) setValues[f] = (updates as any)[f];
      await tx.update(employees).set(setValues).where(eq(employees.id, employeeId));
    }

    await upsertOnboardingProfile(employeeId, updates as any, tx);
  });
}

export async function deactivate(id: number | string, actorId: number | null = null) {
  await db.update(employees).set({ status: 'terminated' }).where(eq(employees.id, Number(id)));
}

export async function approve(id: number | string, passwordHash: string, actorId: number | null = null) {
  await db
    .update(employees)
    .set({ status: 'active', password_hash: passwordHash })
    .where(eq(employees.id, Number(id)));
}

export async function reject(id: number | string) {
  await db.delete(employees).where(eq(employees.id, Number(id)));
}

export async function findPayrollBaseById(id: number | string) {
  const rows = await db
    .select({
      id: employees.id,
      name: employees.name,
      designation: designations.title,
      department: departments.name,
      salary: employeeCompensationHistory.salary,
      pay_frequency: employeeCompensationHistory.pay_frequency,
      start_date: employees.start_date,
    })
    .from(employees)
    .leftJoin(designations, eq(employees.designation_id, designations.id))
    .leftJoin(departments, eq(employees.department_id, departments.id))
    .leftJoin(
      employeeCompensationHistory,
      and(eq(employeeCompensationHistory.employee_id, employees.id), sql`${employeeCompensationHistory.effective_to} IS NULL`)
    )
    .where(and(eq(employees.id, Number(id)), ACTIVE_ROSTER))
    .limit(1);
  return rows[0] || null;
}

export async function findPayrollColumns(id: number | string | null) {
  const cols = {
    id: employees.id,
    name: employees.name,
    designation: designations.title,
    department: departments.name,
    role: employees.role,
    salary: employeeCompensationHistory.salary,
    pay_frequency: employeeCompensationHistory.pay_frequency,
  };
  const where = id ? and(ACTIVE_ROSTER, eq(employees.id, Number(id))) : ACTIVE_ROSTER;
  return db
    .select(cols)
    .from(employees)
    .leftJoin(designations, eq(employees.designation_id, designations.id))
    .leftJoin(departments, eq(employees.department_id, departments.id))
    .leftJoin(
      employeeCompensationHistory,
      and(eq(employeeCompensationHistory.employee_id, employees.id), sql`${employeeCompensationHistory.effective_to} IS NULL`)
    )
    .where(where)
    .orderBy(employees.name);
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

const { password_hash: _omitPasswordHash, ...PROFILE_COLUMNS } = BASE_COLUMNS;

export async function findProfileById(id: number | string) {
  const rows = await withDocJoins(
    db
      .select(PROFILE_COLUMNS)
      .from(employees)
      .leftJoin(designations, eq(employees.designation_id, designations.id))
      .leftJoin(departments, eq(employees.department_id, departments.id)) as any
  )
    .where(and(eq(employees.id, Number(id)), ACTIVE_ROSTER))
    .limit(1);
  return rows[0] || null;
}

export async function findProfilePictureById(id: number | string) {
  const rows = await db
    .select({ filename: employeeDocuments.filename })
    .from(employeeDocuments)
    .where(and(eq(employeeDocuments.emp_id, Number(id)), eq(employeeDocuments.name, 'profile_picture')))
    .limit(1);
  return rows[0]?.filename || null;
}

export async function updateProfilePicture(id: number | string, filename: string) {
  await recordDocumentUpload(id, 'profile_picture', filename);
}

const CITIZENSHIP_SLOTS = ['citizenship_front', 'citizenship_back'];
export async function findCitizenshipDocById(id: number | string, column: string) {
  if (!CITIZENSHIP_SLOTS.includes(column)) throwStatus('Invalid document column', 400);
  const rows = await db
    .select({ filename: employeeDocuments.filename })
    .from(employeeDocuments)
    .where(and(eq(employeeDocuments.emp_id, Number(id)), eq(employeeDocuments.name, column)))
    .limit(1);
  return rows[0]?.filename || null;
}

export async function updateCitizenshipDoc(id: number | string, column: string, filename: string) {
  await recordDocumentUpload(id, column, filename);
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
  slot: string,
  filename: string,
  tx: Tx | Db = db
) {
  await tx
    .delete(employeeDocuments)
    .where(and(eq(employeeDocuments.emp_id, Number(employeeId)), eq(employeeDocuments.name, slot)));
  await tx.insert(employeeDocuments).values({
    emp_id: Number(employeeId),
    name: slot,
    filename,
    url: null,
  });
}
