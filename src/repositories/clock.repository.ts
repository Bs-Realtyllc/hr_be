import { employeeDailyClock } from "../models/EmployeeDailyClock";
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

async function getRow(empId: number, today: string) {
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
  const [row] = await db
    .select()
    .from(employeeDailyClock)
    .where(
      and(
        eq(employeeDailyClock.employeeId, empId),
        eq(employeeDailyClock.clockDate, today),
      ),
    )
    .limit(1);
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

export async function addPause(empId: number, reason: string) {
  const today = todayString();

  const result = await db
    .update(employeeDailyClock)
    .set({ pause: new Date(), pause_reason: reason })
    .where(
      and(
        eq(employeeDailyClock.employeeId, empId),
        eq(employeeDailyClock.clockDate, today),
      ),
    );

  if (result[0].affectedRows === 0) {
    throw new AppError("No clock-in record found for today.", 404);
  }

  return getRow(empId, today);
}

export async function addResume(empId: number) {
  const today = todayString();

  const result = await db
    .update(employeeDailyClock)
    .set({ resume: new Date() })
    .where(
      and(
        eq(employeeDailyClock.employeeId, empId),
        eq(employeeDailyClock.clockDate, today),
      ),
    );

  if (result[0].affectedRows === 0) {
    throw new AppError("No clock-in record found for today.", 404);
  }

  return getRow(empId, today);
}
export async function getAllForToday(today: string) {
  const row = await db
    .select({
      id: employees.id,
      name: employees.name,
      gender: employees.gender,
      email: employees.email,
      phone: employees.phone,
      profile_picture: employees.profile_picture,
      start_date: employees.start_date,
      role: employees.role,
      address: employees.address,
      discord_username: employees.discord_username,
      work_hours: employees.work_hours,
      clockDate: employeeDailyClock.clockDate,
      clockIn: employeeDailyClock.clockIn,
      clockOut: employeeDailyClock.clockOut,
      duration: employeeDailyClock.duration,
      pause: employeeDailyClock.pause,
      pause_reason: employeeDailyClock.pause_reason,
      resume: employeeDailyClock.resume,
    })
    .from(employeeDailyClock)
    .leftJoin(employees, eq(employeeDailyClock.employeeId, employees.id))
    .where(
      and(
        eq(employees.status, "active"),
        eq(employeeDailyClock.clockDate, today),
      ),
    );

  if (!row) {
    throw new AppError(`No clock-in record found for ${today}.`, 404);
  }
  return row;
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

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        employeeId: employees.id,
        name: employees.name,
        email: employees.email,
        phone: employees.phone,
        profilePicture: employees.profile_picture,
        workHours: employees.work_hours,
        clockRecordId: employeeDailyClock.id,
        clockDate: employeeDailyClock.clockDate,
        clockIn: employeeDailyClock.clockIn,
        clockOut: employeeDailyClock.clockOut,
        duration: employeeDailyClock.duration,
        pause: employeeDailyClock.pause,
        resume: employeeDailyClock.resume,
      })
      .from(employeeDailyClock)
      .leftJoin(employees, eq(employeeDailyClock.employeeId, employees.id))
      .where(whereClause)
      .orderBy(orderFn(employeeDailyClock.clockDate), orderFn(employeeDailyClock.id))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: count() })
      .from(employeeDailyClock)
      .leftJoin(employees, eq(employeeDailyClock.employeeId, employees.id))
      .where(whereClause),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: offset + rows.length < total,
      hasPrev: page > 1,
    },
  };
}