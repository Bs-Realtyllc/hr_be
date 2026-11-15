import AppError from "../pkg/AppError";
import { nepalDateString, nepalTimeToUtc } from "../pkg/timezone";
import * as employeeDailyClockRepo from "../repositories/clock.repository";
import * as companySettingsRepo from "../repositories/companySettings.repository";

export interface AttendanceQuery {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
  sortDir?: string;
}

interface RawRow {
  employeeId: number;
  name: string;
  clockId: number;
  clockIn: Date | string;
  clockOut: Date | string | null;
  clockDate: string;
  pause: Date | string | null;
  resume: Date | string | null;
  pauseDuration?:number | null;
  reason: string;
}

interface GroupedClockRecord {
  employeeId: number;
  name: string;
  clockId: number;
  clockIn: Date | string;
  clockOut: Date | string | null;
  clockDate: string;
  pauses: { pause: Date | string | null; resume: Date | string | null; reason: string | null, pauseDuration: number | null }[];
}

function groupByClockId(rows: RawRow[]): GroupedClockRecord[] {
  const map = new Map<number, GroupedClockRecord>();

  for (const row of rows) {
    const {
      employeeId,
      name,
      clockId,
      clockIn,
      clockOut,
      clockDate,
      pause,
      resume,
      pauseDuration,
      reason,
        } = row;

    if (!map.has(clockId)) {
      map.set(clockId, {
        employeeId,
        name,
        clockId,
        clockIn,
        clockOut,
        clockDate,
        pauses: [],
      });
    }

    if (pause) {
      map.get(clockId)!.pauses.push({ pause, resume, reason, pauseDuration });
    }

  }

  return Array.from(map.values());
}

// Company working hours are optional — until an admin sets them, nothing
// is ever flagged late. When set, "late" means the clock-in happened after
// work_start + the configured grace period, on that shift's own Nepal day.
async function buildLateChecker() {
  const settings = await companySettingsRepo.find();
  const workStart = settings?.work_start;
  if (!workStart) return () => false;

  const graceMinutes = settings?.late_grace_minutes ?? 0;
  return (clockIn: Date | string, clockDate: string) => {
    const threshold = nepalTimeToUtc(clockDate, workStart);
    threshold.setMinutes(threshold.getMinutes() + graceMinutes);
    return new Date(clockIn).getTime() > threshold.getTime();
  };
}

function parseCoordinates(lat: unknown, lng: unknown) {
  // both missing: location is optional (remove this block if it's required)
  // if (lat == null && lng == null) return null;

  // one without the other is a client bug
  if (lat == null || lng == null) {
    throw new AppError('Both latitude and longitude are required', 400);
  }

  const la = typeof lat === 'string' ? Number(lat) : lat;
  const ln = typeof lng === 'string' ? Number(lng) : lng;

  if (typeof la !== 'number' || !Number.isFinite(la) || la < -90 || la > 90) {
    throw new AppError('Invalid latitude', 400);
  }
  if (typeof ln !== 'number' || !Number.isFinite(ln) || ln < -180 || ln > 180) {
    throw new AppError('Invalid longitude', 400);
  }

  // match the DECIMAL(9,6) column
  return { lat: Number(la.toFixed(6)), lng: Number(ln.toFixed(6)) };
}

export async function clockIn(empId: number, lat: number, lng: number) {
  const coords = parseCoordinates(lat, lng);

  // Split shifts are allowed (clock in again later the same day), but never
  // two open shifts at once.
  const existingOpen = await employeeDailyClockRepo.getOpenShift(empId);
  if (existingOpen) {
    throw new AppError("You're already clocked in — clock out first.", 409);
  }

  return await employeeDailyClockRepo.addClockIn(empId, coords);
}

interface LiveShift {
  clockIn: Date | string;
  clockOut: Date | string | null;
  clockOutEstimated: boolean;
  pauses: { pause: Date | string | null; resume: Date | string | null; reason: string | null; pauseDuration: number | null }[];
}

// Rows come back one-per-pause (or one bare row if there's no pause),
// joined across potentially several shifts on the same date — group them
// back into one entry per shift (per clock_id).
function groupShiftsForDate(rows: any[]): LiveShift[] {
  const shiftMap = new Map<number, LiveShift>();
  for (const row of rows) {
    if (!shiftMap.has(row.clock_id)) {
      shiftMap.set(row.clock_id, { clockIn: row.clockIn, clockOut: row.clockOut, clockOutEstimated: Boolean(row.clockOutEstimated), pauses: [] });
    }
    if (row.pause) {
      shiftMap.get(row.clock_id)!.pauses.push({ pause: row.pause, resume: row.resume, reason: row.reason, pauseDuration: row.pauseDuration });
    }
  }
  return Array.from(shiftMap.values());
}

function sumClockedSeconds(shifts: LiveShift[]): number {
  const now = Date.now();
  return shifts.reduce((total, shift) => {
    const pauseTotal = shift.pauses.reduce((sum, p) => sum + (p.pauseDuration ?? 0), 0);
    const start = new Date(shift.clockIn).getTime();
    const end = shift.clockOut ? new Date(shift.clockOut).getTime() : now;
    return total + Math.max(0, Math.floor((end - start) / 1000) - pauseTotal);
  }, 0);
}

// Total time actually clocked on a given date — used to verify overtime
// claims against real attendance instead of trusting a typed-in number.
// `estimated` is true if any contributing shift's clock_out was guessed by
// the stale-shift auto-close job rather than actually reported — callers
// should treat the comparison as unreliable, not a confirmed mismatch.
export async function getTotalClockedSecondsForDate(empId: number, date: string): Promise<{ seconds: number; estimated: boolean }> {
  const rows = await employeeDailyClockRepo.getClock(empId, date);
  const shifts = groupShiftsForDate(rows);
  return { seconds: sumClockedSeconds(shifts), estimated: shifts.some((s) => s.clockOutEstimated) };
}

// One specific recorded shift, by its own clock_id — lets an employee claim
// overtime against a real session (picked from their own Tracker history)
// instead of typing a number, and lets the server independently verify that
// claim rather than trusting whatever work_date/hours the client sends.
export async function getShiftSummary(clockId: number): Promise<{
  employeeId: number;
  clockDate: string;
  clockIn: Date | string;
  clockOut: Date | string | null;
  clockOutEstimated: boolean;
  totalSeconds: number;
} | null> {
  const rows = await employeeDailyClockRepo.getShiftWithPauses(clockId);
  if (rows.length === 0) return null;

  const { employeeId, clockIn, clockOut, clockOutEstimated, clockDate } = rows[0];
  const pauses = rows
    .filter((r) => r.pause)
    .map((r) => ({ pause: r.pause, resume: r.resume, reason: null, pauseDuration: r.pauseDuration }));
  const totalSeconds = sumClockedSeconds([{ clockIn, clockOut, clockOutEstimated: Boolean(clockOutEstimated), pauses }]);

  return { employeeId, clockDate, clockIn, clockOut, clockOutEstimated: Boolean(clockOutEstimated), totalSeconds };
}

export async function getClock(empId: number, date?: string) {
  const today = date || nepalDateString();
  const rows = await employeeDailyClockRepo.getClock(empId, today);
  const shifts = groupShiftsForDate(rows);

  const openShift = shifts.find((s) => !s.clockOut) ?? null;

  // Shifts that already finished earlier today are "banked" — the frontend
  // only needs to live-tick the currently open one on top of this.
  const totalSecondsEarlierToday = sumClockedSeconds(shifts.filter((s) => s !== openShift));

  const status: "idle" | "running" | "paused" = !openShift
    ? "idle"
    : openShift.pauses.some((p) => p.pause && !p.resume)
      ? "paused"
      : "running";

  const openPauses = openShift?.pauses ?? [];

  return {
    status,
    employeeId: empId,
    clockIn: openShift?.clockIn ?? null,
    totalSecondsEarlierToday,
    totalPauseDuration: openPauses.reduce((sum, p) => sum + (p.pauseDuration ?? 0), 0),
    pauses: openPauses.map(({ pause, resume, reason, pauseDuration }) => ({
      pause,
      resume,
      reason,
      pauseDuration,
    })),
  };
}

export async function clockOut(empId: number, lat: number, lng: number) {
  const coords = parseCoordinates(lat, lng);

  const shift = await employeeDailyClockRepo.getOpenShift(empId);
  if (!shift) {
    throw new AppError("You're not clocked in.", 400);
  }
  return await employeeDailyClockRepo.addClockOut(shift.id, coords);
}

export async function pause(empId: number, reason: string) {
  const shift = await employeeDailyClockRepo.getOpenShift(empId);
  if (!shift) {
    throw new AppError("You're not clocked in.", 400);
  }

  const pauses = await employeeDailyClockRepo.getPauseRow(shift.id);
  const isPaused = pauses.some((p) => p.pause && !p.resume);
  if (isPaused) {
    throw new AppError("You have already paused the timer", 400);
  }
  if (!reason?.trim()) {
    throw new AppError("Cannot pause clock without valid reason", 400);
  }

  return await employeeDailyClockRepo.addPause(shift.id, empId, reason);
}

export async function resume(empId: number) {
  const shift = await employeeDailyClockRepo.getOpenShift(empId);
  if (!shift) {
    throw new AppError("You're not clocked in.", 400);
  }

  const pauses = await employeeDailyClockRepo.getPauseRow(shift.id);
  const openPause = pauses.find((p) => p.pause && !p.resume);
  if (!openPause) {
    throw new AppError("You have not paused the clock.", 400);
  }

  const now = new Date();
  if (now < new Date(openPause.pause)) {
    throw new AppError("Resume time cannot be before pause time.", 400);
  }

  return await employeeDailyClockRepo.addResume(openPause.id, shift.id);
}

export async function closeStaleOpenShifts(): Promise<number> {
  return await employeeDailyClockRepo.closeStaleOpenShifts();
}

export async function getActiveNow() {
  // The repo query already filters to open shifts only, so status here is
  // always one of these two — never "done".
  const [data, isLate] = await Promise.all([
    employeeDailyClockRepo.getActiveNow(),
    buildLateChecker(),
  ]);
  const grouped = groupByClockId(data);
  const result = grouped.map((row) => {
    const status: 'paused' | 'running' = row.pauses?.some((r) => r.pause && !r.resume) ? 'paused' : 'running';
    return {
      ...row,
      status,
      isLate: isLate(row.clockIn, row.clockDate),
    };
  });
  return result;
}

// service
export async function getAttendance(query: AttendanceQuery) {
  const filters = {
    employeeId: query.employeeId ? Number(query.employeeId) : undefined,
    startDate: (query.startDate as string) || null,
    endDate: (query.endDate as string) || null,
    page: query.page ? Math.max(1, Number(query.page)) : 1,
    limit: query.limit ? Math.min(Number(query.limit), 100) : 20,
    sortDir: query.sortDir === "asc" ? ("asc" as const) : ("desc" as const),
  };
 
  const [{ data, total, page, limit }, isLate] = await Promise.all([
    employeeDailyClockRepo.getAttendance(filters),
    buildLateChecker(),
  ]);

  // groupByClockId is no longer needed here — the repo already returns
  // one entry per clock record with its pauses embedded, correctly paginated.

   const now = Date.now();
   const result = data.map((record) => {
     const totalPauseDuration = record.pauses.reduce(
       (sum, p) => sum + (p.pauseDuration ?? 0),
       0,
     );

     const start = new Date(record.clockIn).getTime();
     const end = record.clockOut ? new Date(record.clockOut).getTime() : now;
     const grossSeconds = Math.floor((end - start) / 1000);
     const totalClockInDuration = Math.max(
       0,
       grossSeconds - totalPauseDuration,
     );

     return {
       ...record,
       clockOutEstimated: Boolean(record.clockOutEstimated),
       totalPauseDuration,
       totalClockInDuration,
       isLate: isLate(record.clockIn, record.clockDate),
     };
   });
 
  return {
    data: result,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}