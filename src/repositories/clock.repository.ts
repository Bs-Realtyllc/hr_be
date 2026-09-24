import { employeeClockPauses, employeeDailyClock } from "../models";
import { employees } from "../models/Employee";
import { db } from "../config/database";
import AppError from "../pkg/AppError";
import { and, eq, count, asc, desc, sql } from "drizzle-orm";

interface AttendanceFilters {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortDir?: string;
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

export async function getAttendance(filters: AttendanceFilters) {
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
      pauseDuration: sql<number | null>`TIMESTAMPDIFF(SECOND, ${employeeClockPauses.pause}, COALESCE(${employeeClockPauses.resume}, ${employeeDailyClock.clockOut}))`.mapWith(Number),

    })
    .from(employeeDailyClock)
    .leftJoin(employees, eq(employeeDailyClock.employeeId, employees.id))
    .leftJoin(
      employeeClockPauses,
      eq(employeeClockPauses.clockId, employeeDailyClock.id),
    )
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  return result;
}