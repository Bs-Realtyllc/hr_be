import { employeeDailyClock } from "../models/EmployeeDailyClock";
import { db } from "../config/database";
import AppError from "../pkg/AppError";
import { and, eq } from "drizzle-orm";

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

export async function addPause(empId: number, reason:string) {
  const today = todayString();

  const result = await db
    .update(employeeDailyClock)
    .set({ pause: new Date(), pause_reason:reason })
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
