import { employeeClockPauses, employeeDailyClock, employees } from "../../drizzle/schema";
import { db } from "../config/database";
import AppError from "../pkg/AppError";
import { nepalDateString, NEPAL_END_OF_DAY_UTC_OFFSET_SECONDS } from "../pkg/timezone";
import { and, eq, inArray, asc, desc, isNull, sql } from "drizzle-orm";

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
  // Named distinctly from the shift's own `source` (web/desktop) field it's
  // often selected alongside — this is whether the pause itself was typed
  // in by the employee or triggered automatically by idle detection.
  pauseSource: 'manual' | 'idle_auto';
  pauseDuration: number | null;
}
 
export interface ClockRow {
  clockId: number;
  employeeId: number;
  name: string;
  email: string;
  address: string | null;
  // profilePicture: string | null;
  phone: string | null;
  clockIn: Date;
  clockOut: Date | null;
  clockDate: string;
  clockOutEstimated: boolean;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  source: 'web' | 'desktop';
}

export interface AttendanceRepoResult {
  data: (ClockRow & { pauses: PauseRow[] })[];
  total: number;
  page: number;
  limit: number;
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

// An employee can have multiple shifts in a day (split shifts), so "current
// state" is found by the one shift still open, not by today's date.
export async function getOpenShift(empId: number) {
  const [row] = await db
    .select()
    .from(employeeDailyClock)
    .where(and(eq(employeeDailyClock.employeeId, empId), isNull(employeeDailyClock.clockOut)))
    .orderBy(desc(employeeDailyClock.clockIn))
    .limit(1);
  return row;
}

export async function getPauseRow(clockId: number) {
  const row = await db
    .select()
    .from(employeeClockPauses)
    .where(eq(employeeClockPauses.clockId, clockId));
  return row;
}

interface coordsType {
  lat: number | null;
  lng: number | null;
}

export async function addClockIn(empId: number, coords: coordsType, source: 'web' | 'desktop' = 'web') {
  let insertId: number;
  try {
    const [result] = await db
      .insert(employeeDailyClock)
      .values({ employeeId: empId, clockDate: nepalDateString(), clockInLat: coords.lat, clockInLng: coords.lng, source });
    insertId = result.insertId;
  } catch (err: any) {
    // Belt-and-suspenders: the service layer already checks for an open
    // shift first, but `one_open_shift_per_employee` is the real guarantee
    // against two open shifts racing in at once.
    if (err?.cause?.code === "ER_DUP_ENTRY" || err?.code === "ER_DUP_ENTRY") {
      throw new AppError("You're already clocked in — clock out first.", 409);
    }
    throw err;
  }
  const [row] = await db
    .select()
    .from(employeeDailyClock)
    .where(eq(employeeDailyClock.id, insertId));
  return row;
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
    pauseSource: employeeClockPauses.source,
    clockOut: employeeDailyClock.clockOut,
    clockOutEstimated: employeeDailyClock.clockOutEstimated,
    clockDate: employeeDailyClock.clockDate,
    source: employeeDailyClock.source,
    idlePromptStartedAt: employeeDailyClock.idlePromptStartedAt,
    idlePromptResponseSeconds: employeeDailyClock.idlePromptResponseSeconds,
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

// One specific shift (by its own id), with pauses — used to let an
// employee claim overtime against a real recorded session instead of
// typing a number, and to verify that claim server-side.
export async function getShiftWithPauses(clockId: number) {
  return db
    .select({
      employeeId: employeeDailyClock.employeeId,
      clockIn: employeeDailyClock.clockIn,
      clockOut: employeeDailyClock.clockOut,
      clockOutEstimated: employeeDailyClock.clockOutEstimated,
      clockDate: employeeDailyClock.clockDate,
      source: employeeDailyClock.source,
      pause: employeeClockPauses.pause,
      resume: employeeClockPauses.resume,
      pauseSource: employeeClockPauses.source,
      pauseDuration: sql<number | null>`TIMESTAMPDIFF(SECOND, ${employeeClockPauses.pause}, COALESCE(${employeeClockPauses.resume}, ${employeeDailyClock.clockOut}))`.mapWith(Number),
    })
    .from(employeeDailyClock)
    .leftJoin(employeeClockPauses, eq(employeeDailyClock.id, employeeClockPauses.clockId))
    .where(eq(employeeDailyClock.id, clockId));
}

export async function addClockOut(clockId: number, coords: coordsType) {
  const result = await db
    .update(employeeDailyClock)
    .set({ clockOut: new Date(), clockOutLat: coords.lat, clockOutLng: coords.lng })
    .where(eq(employeeDailyClock.id, clockId));
  if (result[0].affectedRows === 0) {
    throw new AppError("No open shift found.", 404);
  }
  const [row] = await db
    .select()
    .from(employeeDailyClock)
    .where(eq(employeeDailyClock.id, clockId));

  return row;
}

// Anyone who forgot to clock out gets auto-closed at 23:59:59 Nepal time on
// the day their shift started — capped at one day's length rather than
// running indefinitely into however many days later someone notices. Only
// ever touches shifts whose clock_date is a PAST Nepal day, so a shift that
// genuinely started today and is still open is never affected. Any pause
// left open on a closed shift still resolves correctly — getClock/getAttendance
// already fall back to clock_out when a pause has no resume time.
export async function closeStaleOpenShifts(): Promise<number> {
  const today = nepalDateString();
  const result = await db
    .update(employeeDailyClock)
    .set({
      clockOut: sql`DATE_ADD(${employeeDailyClock.clockDate}, INTERVAL ${NEPAL_END_OF_DAY_UTC_OFFSET_SECONDS} SECOND)`,
      clockOutEstimated: true,
    })
    .where(and(isNull(employeeDailyClock.clockOut), sql`${employeeDailyClock.clockDate} < ${today}`));
  return result[0]?.affectedRows ?? 0;
}

// Ground truth for "is the idle prompt active, and how much time is left" —
// any client reconstructs this from the row itself, never trusting a socket
// event alone (see schema.ts comment on these two columns).
export async function setIdlePrompt(clockId: number, responseSeconds: number) {
  const startedAt = new Date();
  await db
    .update(employeeDailyClock)
    .set({ idlePromptStartedAt: startedAt, idlePromptResponseSeconds: responseSeconds })
    .where(eq(employeeDailyClock.id, clockId));
  return startedAt;
}

export async function clearIdlePrompt(clockId: number) {
  await db
    .update(employeeDailyClock)
    .set({ idlePromptStartedAt: null, idlePromptResponseSeconds: null })
    .where(eq(employeeDailyClock.id, clockId));
}

export async function addPause(clockId: number, empId: number, reason: string, source: 'manual' | 'idle_auto' = 'manual') {
  const [result] = await db
    .insert(employeeClockPauses)
    .values({ clockId: clockId, reason: reason, source });

  if(result.affectedRows === 0) throw new AppError('Unable to add new Pause record', 500);

  return getPauseRow(clockId);
}

export async function addResume(clockPauseId: number, clockId: number) {
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
export async function getTodayActivity() {
// Every employee can see this (it's just today's roster), so it
// deliberately excludes email/phone/address — only the admin/lead-only
// attendance history exposes contact details. Scoped to today's shifts
// (open or already closed) rather than just open ones, so someone who
// already clocked out still shows up as "done" instead of disappearing —
// the service layer collapses split shifts down to one row per employee.
const today = nepalDateString();
const result = await db
  .select({
    employeeId: employees.id,
    name: employees.name,
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
  .innerJoin(employees, eq(employeeDailyClock.employeeId, employees.id))
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
      address: employees.currentAddress,
      // profilePicture: employees.profile_picture,
      phone: employees.phone,
      clockIn: employeeDailyClock.clockIn,
      clockOut: employeeDailyClock.clockOut,
      clockDate: employeeDailyClock.clockDate,
      clockOutEstimated: employeeDailyClock.clockOutEstimated,
      clockInLat: employeeDailyClock.clockInLat,
      clockInLng: employeeDailyClock.clockInLng,
      clockOutLat: employeeDailyClock.clockOutLat,
      clockOutLng: employeeDailyClock.clockOutLng,
      source: employeeDailyClock.source,
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
      pauseSource: employeeClockPauses.source,
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
 