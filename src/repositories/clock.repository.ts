import { employeeClockPauses, employeeDailyClock } from "../models";
import { employees } from "../models/Employee";
import { db } from "../config/database";
import AppError from "../pkg/AppError";
import { and, eq, inArray, asc, desc, sql } from "drizzle-orm";

export interface AttendanceFilters {
  employeeId?: number;
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  limit?: number;
  sortDir?: "asc" | "desc";
}
 
export interface PauseRow {
  clockId: number;
  pause: Date;
  resume: Date | null;
  reason: string | null;
  pauseDuration: number | null;
}
 
export interface ClockRow {
  clockId: number;
  employeeId: number;
  name: string;
  email: string;
  address: string | null;
  profilePicture: string | null;
  phone: string | null;
  clockIn: Date;
  clockOut: Date | null;
  clockDate: string;
}
 
export interface AttendanceRepoResult {
  data: (ClockRow & { pauses: PauseRow[] })[];
  total: number;
  page: number;
  limit: number;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export async function getClockRow(empId: number, today: string) {
  const [row] = await db
    .select()
    .from(employeeDailyClock)
    .where(
      and(
        eq(employeeDailyClock.employeeId, empId),
        eq(employeeDailyClock.clockDate, today),
      ),
    );
  return row;
}

export async function getPauseRow(clockId: number) {
  const row = await db
    .select()
    .from(employeeClockPauses)
    .where(eq(employeeClockPauses.clockId, clockId));
  return row;
}


export async function addClockIn(empId: number) {
  // console.log(empId)
  try {
    const [result] = await db
      .insert(employeeDailyClock)
      .values({ employeeId: empId });
    const [row] = await db
      .select()
      .from(employeeDailyClock)
      .where(eq(employeeDailyClock.id, result.insertId));
    return row;
  } catch (err: any) {
    if (err.cause.code === "ER_DUP_ENTRY") {
      throw new AppError("You have already clocked in today.", 409);
    }
    throw err;
  }
}
export async function getClock(empId: number, today: string) {
const row = await db
  .select({
    id: employeeClockPauses.id,
    clock_id: employeeDailyClock.id,
    employeeId: employeeDailyClock.employeeId,
    clockIn: employeeDailyClock.clockIn,
    pause: employeeClockPauses.pause,
    resume: employeeClockPauses.resume,
    reason: employeeClockPauses.reason,
    clockOut: employeeDailyClock.clockOut,
    clockDate: employeeDailyClock.clockDate,
    pauseDuration: sql<number | null>`TIMESTAMPDIFF(SECOND, ${employeeClockPauses.pause}, COALESCE(${employeeClockPauses.resume}, ${employeeDailyClock.clockOut}))`.mapWith(Number),
  })
  .from(employeeDailyClock)
  .leftJoin(
    employeeClockPauses,
    eq(employeeDailyClock.id, employeeClockPauses.clockId)
  )
  .where(and(eq(employeeDailyClock.employeeId, empId), eq(employeeDailyClock.clockDate, today) ))
  .orderBy(asc(employeeClockPauses.createdAt));
  if (!row) {
    throw new AppError(`No clock-in record found for ${today}.`, 404);
  }
  return row;
}
export async function addClockOut(empId: number) {
  const result = await db
    .update(employeeDailyClock)
    .set({ clockOut: new Date() })
    .where(
      and(
        eq(employeeDailyClock.employeeId, empId),
        eq(employeeDailyClock.clockDate, todayString()),
      ),
    );
  if (result[0].affectedRows === 0) {
    throw new AppError("No clock-in record found for today.", 404);
  }
  const [row] = await db
    .select()
    .from(employeeDailyClock)
    .where(
      and(
        eq(employeeDailyClock.employeeId, empId),
        eq(employeeDailyClock.clockDate, todayString()),
      ),
    );

  return row;
}

export async function addPause(clockId:number ,empId: number, reason: string) {
  const today = todayString();

  const [result] = await db
    .insert(employeeClockPauses)
    .values({clockId: clockId, reason: reason});

  if(result.affectedRows === 0) throw new AppError('Unable to add new Pause record', 500);

  return getPauseRow(clockId);
}

export async function addResume(clockPauseId: number, clockId: number) {
  const today = todayString();

  const result = await db
    .update(employeeClockPauses)
    .set({ resume: new Date() })
    .where(
        eq(employeeClockPauses.id, clockPauseId),
    );

  if (result[0].affectedRows === 0) {
    throw new AppError('Unable to resume existing record', 500);
  }

  return getPauseRow(clockId);
}
export async function getAllForToday(today: string) {
const result = await db
  .select({
    employeeId: employees.id,
    name: employees.name,
    email: employees.email,
    address: employees.address,
    profilePicture: employees.profile_picture,
    phone: employees.phone,
    clockId: employeeDailyClock.id,
    clockIn: employeeDailyClock.clockIn,
    clockOut: employeeDailyClock.clockOut,
    clockDate: employeeDailyClock.clockDate,
    pause: employeeClockPauses.pause,
    resume: employeeClockPauses.resume,
    reason: employeeClockPauses.reason,
  })
  .from(employees)
  .leftJoin(
    employeeDailyClock,
    eq(employeeDailyClock.employeeId, employees.id)
  )
  .leftJoin(
    employeeClockPauses,
    eq(employeeClockPauses.clockId, employeeDailyClock.id)
  )
  .where(eq(employeeDailyClock.clockDate, today));

  return result;
}

export async function getAttendance(
  filters: AttendanceFilters,
): Promise<AttendanceRepoResult> {
  const {
    employeeId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortDir = "desc",
  } = filters;
 
  const conditions = [eq(employees.status, "active")];
 
  if (employeeId) {
    conditions.push(eq(employeeDailyClock.employeeId, employeeId));
  }
  if (startDate) {
    conditions.push(sql`${employeeDailyClock.clockDate} >= ${startDate}`);
  }
  if (endDate) {
    conditions.push(sql`${employeeDailyClock.clockDate} <= ${endDate}`);
  }
 
  const whereClause = and(...conditions);
  const offset = (page - 1) * limit;
  const orderFn = sortDir === "asc" ? asc : desc;
 
  // 1) Paginate over CLOCK RECORDS, not raw joined rows.
  //    This is the piece that was missing — one row per clockId here,
  //    so LIMIT/OFFSET actually reflects "records", not "records x pauses".
  const clockRowsQuery = db
    .select({
      clockId: employeeDailyClock.id,
      employeeId: employees.id,
      name: employees.name,
      email: employees.email,
      address: employees.address,
      profilePicture: employees.profile_picture,
      phone: employees.phone,
      clockIn: employeeDailyClock.clockIn,
      clockOut: employeeDailyClock.clockOut,
      clockDate: employeeDailyClock.clockDate,
    })
    .from(employeeDailyClock)
    .leftJoin(employees, eq(employeeDailyClock.employeeId, employees.id))
    .where(whereClause)
    .orderBy(orderFn(employeeDailyClock.clockIn))
    .limit(limit)
    .offset(offset);
 
  // 2) Total count of matching clock records (for pagination metadata).
  const countQuery = db
    .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
    .from(employeeDailyClock)
    .leftJoin(employees, eq(employeeDailyClock.employeeId, employees.id))
    .where(whereClause);
 
  const [clockRows, countResult] = await Promise.all([
    clockRowsQuery,
    countQuery,
  ]);
 
  const total = countResult[0]?.count ?? 0;
 
  if (clockRows.length === 0) {
    return { data: [], total, page, limit };
  }
 
  // 3) Fetch pauses ONLY for this page's clock records — no limit/offset here,
  //    so a record's pause list is never truncated or split across pages.
  const clockIds = clockRows.map((r) => r.clockId);
 
  const pauseRows = await db
    .select({
      clockId: employeeClockPauses.clockId,
      pause: employeeClockPauses.pause,
      resume: employeeClockPauses.resume,
      reason: employeeClockPauses.reason,
      pauseDuration: sql<number | null>`TIMESTAMPDIFF(SECOND, ${employeeClockPauses.pause}, COALESCE(${employeeClockPauses.resume}, ${employeeDailyClock.clockOut}))`.mapWith(
        Number,
      ),
    })
    .from(employeeClockPauses)
    .leftJoin(
      employeeDailyClock,
      eq(employeeDailyClock.id, employeeClockPauses.clockId),
    )
    .where(inArray(employeeClockPauses.clockId, clockIds));
 
  const pausesByClockId = new Map<number, PauseRow[]>();
  for (const p of pauseRows) {
    if (!pausesByClockId.has(p.clockId)) pausesByClockId.set(p.clockId, []);
    pausesByClockId.get(p.clockId)!.push(p);
  }
 
  const data = clockRows.map((row) => ({
    ...row,
    pauses: pausesByClockId.get(row.clockId) ?? [],
  }));
 
  return { data, total, page, limit };
}
 