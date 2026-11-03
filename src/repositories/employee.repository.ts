import { eq, and, sql, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "../config/database";
import {
  employees,
  employeeCompensationHistory,
  employeeDocuments,
  departments,
  designations,
  leaveRequests,
} from "../../drizzle/schema";
import type {
  EmployeeCreateInput,
  EmployeeUpdateInput,
} from "../dtos/employee.dto";
import AppError from "../pkg/AppError";

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function throwStatus(message: string, status: number): never {
  const err: any = new Error(message);
  err.status = status;
  throw err;
}

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const manager = alias(employees, "manager");
const docPic = alias(employeeDocuments, "doc_pic");
const docCf = alias(employeeDocuments, "doc_cf");
const docCb = alias(employeeDocuments, "doc_cb");

const ACTIVE_ROSTER = sql`${employees.status} NOT IN ('terminated')`; //filter only terminated employee not onboarding

const BASE_COLUMNS = {
  id: employees.id,
  name: employees.name,
  email: employees.email,
  phone: employees.phone,
  secondary_email: employees.secondaryEmail,
  designation_id: employees.designationId,
  designation: designations.title,
  department_id: employees.departmentId,
  department: departments.name,
  manager_id: employees.managerId,
  start_date: employees.startDate,
  dob: employees.dob,
  gender: employees.gender,
  github_url: employees.githubUrl,
  address: employees.address,
  discord_username: employees.discordUsername,
  panNo: employees.panNo,
  role: employees.role,
  password_hash: employees.passwordHash,
  status: employees.status,
  profile_picture: docPic.filename,
  citizenship_front: docCf.filename,
  citizenship_back: docCb.filename,
};

function withDocJoins<T extends { leftJoin: any }>(query: T): T {
  return query
    .leftJoin(
      docPic,
      and(eq(docPic.empId, employees.id), eq(docPic.name, "profile_picture")),
    )
    .leftJoin(
      docCf,
      and(eq(docCf.empId, employees.id), eq(docCf.name, "citizenship_front")),
    )
    .leftJoin(
      docCb,
      and(eq(docCb.empId, employees.id), eq(docCb.name, "citizenship_back")),
    );
}

function baseQuery() {
  return withDocJoins(
    db
      .select(BASE_COLUMNS)
      .from(employees)
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .leftJoin(
        departments,
        eq(employees.departmentId, departments.id),
      ) as any,
  );
}

function baseQueryWithManager() {
  return withDocJoins(
    db
      .select({ ...BASE_COLUMNS, manager_name: manager.name })
      .from(employees)
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(manager, eq(employees.managerId, manager.id)) as any,
  );
}

export async function findAllActive() {
  return baseQueryWithManager().where(ACTIVE_ROSTER).orderBy(employees.name);
}
export async function findAllActiveNames() {
  const rows = await db
    .select({ id: employees.id, name: employees.name, role: employees.role })
    .from(employees)
    .where(ACTIVE_ROSTER)
    .orderBy(employees.name);
  return rows;
}

export async function findAllOnboarding() {
  return baseQueryWithManager()
    .where(eq(employees.status, "onboarding"))
    .orderBy(employees.name);
}

export async function findById(id: number | string) {
  const rows = await baseQueryWithManager()
    .where(eq(employees.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function findByEmail(email: string) {
  const rows = await baseQuery().where(eq(employees.email, email)).limit(1);
  return rows[0] || null;
}

export async function findLeads() {
  return db
    .select({ id: employees.id, name: employees.name, email: employees.email })
    .from(employees)
    .where(and(eq(employees.role, "lead"), ACTIVE_ROSTER));
}

export async function findBySecondaryEmail(email: string) {
  const rows = await baseQuery()
    .where(eq(employees.secondaryEmail, email))
    .limit(1);
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
      password_hash: employees.passwordHash,
      two_factor_enabled: employees.twoFactorEnabled,
    })
    .from(employees)
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
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
      designation: designations.title,
      department: departments.name,
      password_hash: employees.passwordHash,
    })
    .from(employees)
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(and(eq(employees.id, id), ACTIVE_ROSTER))
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
    .select({ password_hash: employees.passwordHash })
    .from(employees)
    .where(eq(employees.id, Number(id)))
    .limit(1);
  return rows[0]?.password_hash || null;
}

export async function updatePasswordHash(id: number | string, hash: string) {
  await db
    .update(employees)
    .set({ passwordHash: hash })
    .where(eq(employees.id, Number(id)));
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
    .where(eq(employees.discordUsername, discordUsername))
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

async function findOrCreateDepartmentId(
  name: string | null | undefined,
  tx: Tx,
) {
  if (!name) return null;
  const existing = await tx
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.name, name))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const result = await tx
    .insert(departments)
    .values({ name, isActive: true, createdAt: new Date() });
  return insertedId(result);
}

async function findOrCreateDesignationId(
  title: string | null | undefined,
  tx: Tx,
) {
  if (!title) return null;
  const existing = await tx
    .select({ id: designations.id })
    .from(designations)
    .where(eq(designations.title, title))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const result = await tx
    .insert(designations)
    .values({ title, isActive: true, createdAt: new Date() });
  return insertedId(result);
}

const ONBOARDING_PROFILE_FIELDS = [
  "education_level",
  "institution_name",
  "field_of_study",
  "graduation_date",
  "previous_experience",
  "areas_of_interest",
  "linkedin_url",
  "portfolio_url",
] as const;

async function upsertOnboardingProfile(
  employeeId: number | string,
  fields: Record<string, any>,
  tx: Tx | Db = db,
) {
  const present = ONBOARDING_PROFILE_FIELDS.filter(
    (f) => fields[f] !== undefined,
  );
  if (!present.length) return;

  const insertCols = ["employee_id", ...present];
  const insertVals = [Number(employeeId), ...present.map((f) => fields[f])];
  const updateClause = sql.join(
    present.map((f) => sql.raw(`${f} = VALUES(${f})`)),
    sql`, `,
  );

  await tx.execute(sql`
    INSERT INTO employee_onboarding_profile (${sql.raw(insertCols.join(", "))})
    VALUES (${sql.join(
      insertVals.map((v) => sql`${v}`),
      sql`, `,
    )})
    ON DUPLICATE KEY UPDATE ${updateClause}
  `);
}

export async function create(
  data: EmployeeCreateInput,
  actorId: number | null = null,
) {
  if (data.manager_id != null && Number(data.manager_id) < 1) {
    throwStatus("Invalid manager_id", 400);
  }

  return db.transaction(async (tx) => {
    const departmentId = await findOrCreateDepartmentId(data.department, tx);
    const designationId = await findOrCreateDesignationId(data.designation, tx);

    const result = await tx.insert(employees).values({
      name: data.name,
      email: data.email,
      secondaryEmail: data.secondary_email ?? null,
      managerId: data.manager_id ?? null,
      startDate: data.start_date ?? null,
      designationId,
      departmentId,
      status: data.status,
      role: data.role || "employee",
      gender: data.gender ?? null,
      githubUrl: data.github_url ?? null,
    });
    const employeeId = insertedId(result);

    const [selectedData] = await tx
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        role: employees.role,
      })
      .from(employees)
      .where(eq(employees.id, employeeId));

    if (!selectedData)
      throw new AppError("Failed to get created employee data", 404);
    // await upsertOnboardingProfile(employeeId, data, tx);

    return selectedData;
  });
}

export async function seedLeaveBalances(
  employeeId: number | string,
  year: number,
) {
  await db.execute(sql`
    INSERT INTO leave_balances (employee_id, leave_type, total, taken, year) VALUES
     (${employeeId}, 'sick', 12, 0, ${year}),
     (${employeeId}, 'bereavement', 3, 0, ${year}),
     (${employeeId}, 'maternity', 60, 0, ${year}),
     (${employeeId}, 'paternity', 30, 0, ${year})
  `);
}

// Update-request field (snake_case, as sent by the frontend) -> employees column key.
const EMPLOYEES_TABLE_FIELDS: Record<string, keyof typeof employees.$inferInsert> = {
  dob: "dob",
  address: "address",
  name: "name",
  gender: "gender",
  email: "email",
  secondary_email: "secondaryEmail",
  phone: "phone",
  designation: "designation",
  department: "department",
  department_id: "departmentId",
  manager_id: "managerId",
  start_date: "startDate",
  github_url: "githubUrl",
  discord_username: "discordUsername",
};

export async function update(
  id: number | string,
  updates: EmployeeUpdateInput,
  actorId: number | null = null,
) {
  const fields = Object.keys(updates);
  if (!fields.length) return;
  const employeeId = Number(id);

  await db.transaction(async (tx) => {
    const employeesFields = fields.filter((f) => f in EMPLOYEES_TABLE_FIELDS);

    if (
      ["designation", "department", "manager_id"].some((f) =>
        fields.includes(f),
      )
    ) {
      if (fields.includes("manager_id")) {
        await assertNoManagerCycle(employeeId, (updates as any).manager_id);
      }
      const currentRows = await tx
        .select({
          designation_id: employees.designationId,
          department_id: employees.departmentId,
        })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);
      const current = currentRows[0];
      const departmentId = fields.includes("department")
        ? await findOrCreateDepartmentId((updates as any).department, tx)
        : current?.department_id;
      const designationId = fields.includes("designation")
        ? await findOrCreateDesignationId((updates as any).designation, tx)
        : current?.designation_id;

      const setValues: Record<string, any> = {
        designationId,
        departmentId,
      };
      for (const f of employeesFields) setValues[EMPLOYEES_TABLE_FIELDS[f]] = (updates as any)[f];
      await tx
        .update(employees)
        .set(setValues)
        .where(eq(employees.id, employeeId));
    } else if (employeesFields.length) {
      const setValues: Record<string, any> = {};
      for (const f of employeesFields) setValues[EMPLOYEES_TABLE_FIELDS[f]] = (updates as any)[f];
      await tx
        .update(employees)
        .set(setValues)
        .where(eq(employees.id, employeeId));
    }

    await upsertOnboardingProfile(employeeId, updates as any, tx);
  });
}

export async function deactivate(
  id: number | string,
  actorId: number | null = null,
) {
  await db
    .update(employees)
    .set({ status: "terminated" })
    .where(eq(employees.id, Number(id)));
}

export async function approve(
  id: number | string,
  passwordHash: string,
  actorId: number | null = null,
) {
  await db
    .update(employees)
    .set({ status: "active", passwordHash })
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
      pay_frequency: employeeCompensationHistory.payFrequency,
      start_date: employees.startDate,
    })
    .from(employees)
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(
      employeeCompensationHistory,
      and(
        eq(employeeCompensationHistory.employeeId, employees.id),
        sql`${employeeCompensationHistory.effectiveTo} IS NULL`,
      ),
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
    pay_frequency: employeeCompensationHistory.payFrequency,
  };
  const where = id
    ? and(ACTIVE_ROSTER, eq(employees.id, Number(id)))
    : ACTIVE_ROSTER;
  return db
    .select(cols)
    .from(employees)
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(
      employeeCompensationHistory,
      and(
        eq(employeeCompensationHistory.employeeId, employees.id),
        sql`${employeeCompensationHistory.effectiveTo} IS NULL`,
      ),
    )
    .where(where)
    .orderBy(employees.name);
}

export async function updateSalary(
  id: number | string,
  salary: number | null,
  payFrequency: string | null,
  actorId: number | null = null,
) {
  if (salary == null) {
    await db.execute(sql`
      UPDATE employee_compensation_history SET effective_to = CURDATE()
      WHERE employee_id = ${id} AND effective_to IS NULL
    `);
  } else {
    await recordCompensationChange(id, {
      salary,
      payFrequency,
      changeReason: "salary_update",
      changedBy: actorId,
    });
  }
}

const { password_hash: _omitPasswordHash, ...PROFILE_COLUMNS } = BASE_COLUMNS;

export async function findProfileById(id: number | string) {
  const rows = await withDocJoins(
    db
      .select(PROFILE_COLUMNS)
      .from(employees)
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .leftJoin(
        departments,
        eq(employees.departmentId, departments.id),
      ) as any,
  )
    .where(and(eq(employees.id, Number(id)), ACTIVE_ROSTER))
    .limit(1);
  return rows[0] || null;
}

export async function findProfilePictureById(id: number | string) {
  const rows = await db
    .select({ filename: employeeDocuments.filename })
    .from(employeeDocuments)
    .where(
      and(
        eq(employeeDocuments.empId, Number(id)),
        eq(employeeDocuments.name, "profile_picture"),
      ),
    )
    .limit(1);
  return rows[0]?.filename || null;
}

export async function updateProfilePicture(
  id: number | string,
  filename: string,
) {
  await recordDocumentUpload(id, "profile_picture", filename);
}

const CITIZENSHIP_SLOTS = ["citizenship_front", "citizenship_back"];
export async function findCitizenshipDocById(
  id: number | string,
  column: string,
) {
  if (!CITIZENSHIP_SLOTS.includes(column))
    throwStatus("Invalid document column", 400);
  const rows = await db
    .select({ filename: employeeDocuments.filename })
    .from(employeeDocuments)
    .where(
      and(
        eq(employeeDocuments.empId, Number(id)),
        eq(employeeDocuments.name, column),
      ),
    )
    .limit(1);
  return rows[0]?.filename || null;
}

export async function updateCitizenshipDoc(
  id: number | string,
  column: string,
  filename: string,
) {
  await recordDocumentUpload(id, column, filename);
}

export async function findApprovedLeaveRangesForEmployee(
  id: number | string,
  rangeStart: string,
  rangeEnd: string,
) {
  return db
    .select({
      start_date: leaveRequests.startDate,
      end_date: leaveRequests.endDate,
    })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, Number(id)),
        eq(leaveRequests.status, "approved"),
        sql`${leaveRequests.startDate} <= ${rangeEnd}`,
        sql`${leaveRequests.endDate} >= ${rangeStart}`,
      ),
    );
}

const MAX_MANAGER_CHAIN_DEPTH = 20;
export async function assertNoManagerCycle(
  employeeId: number | string,
  proposedManagerId: number | string | null | undefined,
) {
  if (proposedManagerId == null) return;
  if (Number(proposedManagerId) === Number(employeeId)) {
    throwStatus("An employee cannot be their own manager", 400);
  }
  let currentId: number = Number(proposedManagerId);
  for (let depth = 0; depth < MAX_MANAGER_CHAIN_DEPTH; depth++) {
    const rows = await db
      .select({ manager_id: employees.managerId })
      .from(employees)
      .where(eq(employees.id, currentId))
      .limit(1);
    const nextManagerId = rows[0]?.manager_id;
    if (nextManagerId == null) return;
    if (Number(nextManagerId) === Number(employeeId)) {
      throwStatus("This manager change would create a reporting cycle", 400);
    }
    currentId = nextManagerId;
  }
  console.warn(
    `assertNoManagerCycle: manager chain from ${proposedManagerId} exceeded depth ${MAX_MANAGER_CHAIN_DEPTH}`,
  );
}

export async function recordCompensationChange(
  employeeId: number | string,
  { salary, payFrequency, changeReason, changedBy }: any,
  tx: Tx | Db = db,
) {
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  await tx
    .update(employeeCompensationHistory)
    .set({ effectiveTo: effectiveFrom })
    .where(
      and(
        eq(employeeCompensationHistory.employeeId, Number(employeeId)),
        sql`${employeeCompensationHistory.effectiveTo} IS NULL`,
      ),
    );
  await tx.insert(employeeCompensationHistory).values({
    employeeId: Number(employeeId),
    salary: String(salary),
    payFrequency: (payFrequency ?? "monthly") as
      | "monthly"
      | "biweekly"
      | "weekly",
    effectiveFrom,
    changeReason: changeReason ?? null,
    changedBy: changedBy ?? null,
    createdAt: new Date(),
  });
}

export async function recordDocumentUpload(
  employeeId: number | string,
  slot: string,
  filename: string,
  tx: Tx | Db = db,
) {
  await tx
    .delete(employeeDocuments)
    .where(
      and(
        eq(employeeDocuments.empId, Number(employeeId)),
        eq(employeeDocuments.name, slot),
      ),
    );
  await tx.insert(employeeDocuments).values({
    empId: Number(employeeId),
    name: slot,
    filename,
    url: null,
  });
}

const VALID_ROLES = ["admin", "lead", "employee", "intern"] as const;
const VALID_STATUSES = [
  "onboarding",
  "active",
  "on_leave",
  "probation",
  "terminated",
] as const;

// One bulk-import row, as sent by the frontend (snake_case).
interface BulkEmployeeInput {
  name: string;
  email: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  secondary_email?: string | null;
  phone?: string | null;
  emergency_contact?: string | null;
  designation?: string | null;
  department?: string | null;
  manager_id?: number | null;
  start_date?: string | null;
  dob?: string | null;
  github_url?: string | null;
  address?: string | null;
  discord_username?: string | null;
  panNo?: string | null;
  timezone?: string | null;
  work_hours?: string | null;
  role?: "admin" | "lead" | "employee" | "intern";
  salary?: string | null;
  pay_frequency?: "monthly" | "biweekly" | "weekly" | null;
  status?: "onboarding" | "active" | "on_leave" | "probation" | "offboarding" | "terminated";
}

function validateBulkEmployee(data: BulkEmployeeInput, index: number) {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    errors.push(`Row ${index}: 'name' is required`);
  }

  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    errors.push(`Row ${index}: 'email' is required`);
  }

  if (
    data.role !== undefined &&
    data.role !== null &&
    !VALID_ROLES.includes(data.role as any)
  ) {
    errors.push(
      `Row ${index}: 'role' must be one of ${VALID_ROLES.join(", ")} — got '${data.role}'`,
    );
  }

  if (data.status === undefined || data.status === null) {
    errors.push(`Row ${index}: 'status' is required`);
  } else if (!VALID_STATUSES.includes(data.status as any)) {
    errors.push(
      `Row ${index}: 'status' must be one of ${VALID_STATUSES.join(", ")} — got '${data.status}'`,
    );
  }

  if (data.manager_id != null && Number(data.manager_id) < 1) {
    errors.push(`Row ${index}: 'manager_id' must be a positive number`);
  }

  return errors;
}

export async function createBulk(
  dataList: BulkEmployeeInput[],
  actorId: number | null = null,
) {
  if (!Array.isArray(dataList) || dataList.length === 0) {
    throwStatus("No employee data provided", 400);
  }

  // ── Validate every row up front, before touching the DB ──
  const allErrors: string[] = [];
  dataList.forEach((data, index) => {
    allErrors.push(...validateBulkEmployee(data, index));
  });

  if (allErrors.length > 0) {
    throwStatus(`Validation failed:\n${allErrors.join("\n")}`, 400);
  }

  return db.transaction(async (tx) => {
    //for now - don not accept any data if any one row has designation or department
    const keysToCheck = ["manager_id", "designation_id", "department_id"];

    const someHaveDD = dataList.some((item) =>
      keysToCheck.some((key) => key in item),
    );
    if (someHaveDD)
      throw new AppError(
        "Cannot add department_id or designation_id or or manager_id data during bulk onboarding",
        400,
      );
    // const resolvedRows = await Promise.all(
    //   dataList.map(async (data) => {
    //     // if(data.department)
    //     const departmentId = await findOrCreateDepartmentId(
    //       data.department,
    //       tx,
    //     );
    //     const designationId = await findOrCreateDesignationId(
    //       data.designation,
    //       tx,
    //     );

    //     return {
    //       name: data.name,
    //       email: data.email,
    //       secondary_email: data.secondary_email ?? null,
    //       manager_id: data.manager_id ?? null,
    //       start_date: data.start_date ?? null,
    //       designation_id: designationId,
    //       department_id: departmentId,
    //       status: data.status,
    //       role: data.role || "employee",
    //       gender: data.gender ?? null,
    //       github_url: data.github_url ?? null,
    //     };
    //   }),
    // );

    // ── Single bulk insert ──
    const result = await tx
      .insert(employees)
      .values(
        dataList.map((data) => ({
          name: data.name,
          gender: data.gender,
          email: data.email,
          secondaryEmail: data.secondary_email,
          phone: data.phone,
          emergencyContact: data.emergency_contact,
          designation: data.designation,
          department: data.department,
          startDate: data.start_date,
          dob: data.dob,
          githubUrl: data.github_url,
          address: data.address,
          discordUsername: data.discord_username,
          panNo: data.panNo,
          timezone: data.timezone,
          workHours: data.work_hours,
          role: data.role,
          salary: data.salary,
          payFrequency: data.pay_frequency,
          status: data.status,
        })),
      );

    // MySQL's insertId on a multi-row insert gives you the FIRST inserted row's id;
    // subsequent ids are sequential from there (true only if AUTO_INCREMENT has no gaps
    // from concurrent inserts during this transaction — safe here since we're inside tx).
    const firstId = insertedId(result);
    const insertedIds = dataList.map((_, i) => firstId + i);

    const selectedData = await tx
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        role: employees.role,
      })
      .from(employees)
      .where(inArray(employees.id, insertedIds));

    if (selectedData.length !== dataList.length) {
      throw new AppError("Failed to retrieve all created employees", 500);
    }
    // const selectedDataId = selectedData.map((s) => s.id);
    return selectedData;
  });
}

export async function findEmailsByIds(ids: (number | string)[]) {
  const numericIds = [...new Set(ids.map(Number))].filter(
    (n) => Number.isInteger(n) && n > 0,
  );
  if (numericIds.length === 0) return [];

  return db
    .select({ id: employees.id, email: employees.email })
    .from(employees)
    .where(and(inArray(employees.id, numericIds), ACTIVE_ROSTER));
}