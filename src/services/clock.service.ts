import AppError from "../pkg/AppError";
import { nepalDateString, nepalTimeToUtc } from "../pkg/timezone";
import * as employeeDailyClockRepo from "../repositories/clock.repository";
import * as companySettingsRepo from "../repositories/companySettings.repository";
import * as trackerService from "./tracker.service";

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

function parseCoordinates(lat: unknown, lng: unknown, source: 'web' | 'desktop' = 'web') {
  // Desktop has no real GPS hardware — activity/screenshots are the trust
  // signal there instead, so location is only required for web clock-ins.
  if (source === 'desktop' && lat == null && lng == null) {
    return { lat: null, lng: null };
  }

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

// A bare "something changed, go refetch" push — same philosophy as the
// idle-prompt nudges, just without a payload, since every clock-state
// transition (in/out/pause/resume) needs the same full GET /clock reread
// anyway. Lets any connected device (the web tab, or a desktop app that
// wasn't the one acting) react in milliseconds instead of waiting for its
// next regular poll — the poll stays as the fallback if this is missed.
function notifyClockSync(empId: number, io?: any) {
  io?.to(`user:${empId}`).emit('clock:sync');
  // Admin/lead attendance dashboards watch everyone, not just their own
  // shift — the room-based broadcast pattern for "anyone watching the
  // team" (same thing the inbox's presence feature does per-connection,
  // just scoped to admins/leads instead of blanketing every socket).
  io?.to('role:admin-lead').emit('clock:sync');
}

export async function clockIn(empId: number, lat: number, lng: number, source: 'web' | 'desktop' = 'web', io?: any) {
  const coords = parseCoordinates(lat, lng, source);

  // Split shifts are allowed (clock in again later the same day), but never
  // two open shifts at once.
  const existingOpen = await employeeDailyClockRepo.getOpenShift(empId);
  if (existingOpen) {
    throw new AppError("You're already clocked in — clock out first.", 409);
  }

  const result = await employeeDailyClockRepo.addClockIn(empId, coords, source);
  notifyClockSync(empId, io);
  return result;
}

interface LiveShift {
  clockId: number;
  source: "web" | "desktop";
  clockIn: Date | string;
  clockOut: Date | string | null;
  clockOutEstimated: boolean;
  idlePromptStartedAt: Date | string | null;
  idlePromptResponseSeconds: number | null;
  pauses: { pause: Date | string | null; resume: Date | string | null; reason: string | null; pauseSource: "manual" | "idle_auto"; pauseDuration: number | null }[];
}

// Rows come back one-per-pause (or one bare row if there's no pause),
// joined across potentially several shifts on the same date — group them
// back into one entry per shift (per clock_id).
function groupShiftsForDate(rows: any[]): LiveShift[] {
  const shiftMap = new Map<number, LiveShift>();
  for (const row of rows) {
    if (!shiftMap.has(row.clock_id)) {
      shiftMap.set(row.clock_id, {
        clockId: row.clock_id,
        source: row.source,
        clockIn: row.clockIn,
        clockOut: row.clockOut,
        clockOutEstimated: Boolean(row.clockOutEstimated),
        idlePromptStartedAt: row.idlePromptStartedAt,
        idlePromptResponseSeconds: row.idlePromptResponseSeconds,
        pauses: [],
      });
    }
    if (row.pause) {
      shiftMap.get(row.clock_id)!.pauses.push({
        pause: row.pause,
        resume: row.resume,
        reason: row.reason,
        pauseSource: row.pauseSource,
        pauseDuration: row.pauseDuration,
      });
    }
  }
  return Array.from(shiftMap.values());
}

// A closed desktop shift's clocked seconds is its verified (screenshot-
// backed) time, same policy as the attendance list — every "today"/"this
// shift" total has to agree with what the attendance list shows, or the
// two numbers silently drift apart. Still-open shifts and web shifts keep
// raw wall-clock time (see getAttendance for why).
async function sumClockedSeconds(shifts: LiveShift[]): Promise<number> {
  const now = Date.now();
  const closedDesktopClockIds = shifts
    .filter((s) => s.source === "desktop" && s.clockOut)
    .map((s) => s.clockId);
  const verifiedByClockId = await trackerService.getVerifiedSecondsByClockIds(closedDesktopClockIds);

  return shifts.reduce((total, shift) => {
    if (shift.source === "desktop" && shift.clockOut) {
      return total + (verifiedByClockId.get(shift.clockId) ?? 0);
    }
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
  return { seconds: await sumClockedSeconds(shifts), estimated: shifts.some((s) => s.clockOutEstimated) };
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

  const { employeeId, clockIn, clockOut, clockOutEstimated, clockDate, source } = rows[0];
  const pauses = rows
    .filter((r) => r.pause)
    .map((r) => ({ pause: r.pause, resume: r.resume, reason: null, pauseSource: r.pauseSource, pauseDuration: r.pauseDuration }));
  const totalSeconds = await sumClockedSeconds([{
    clockId, source, clockIn, clockOut, pauses,
    clockOutEstimated: Boolean(clockOutEstimated),
    // This shift is already closed (clockOut is set) by the time anyone
    // looks it up here, so it can never have an idle prompt mid-flight.
    idlePromptStartedAt: null,
    idlePromptResponseSeconds: null,
  }]);

  return { employeeId, clockDate, clockIn, clockOut, clockOutEstimated: Boolean(clockOutEstimated), totalSeconds };
}

export async function getClock(empId: number, date?: string) {
  const today = date || nepalDateString();
  const rows = await employeeDailyClockRepo.getClock(empId, today);
  const shifts = groupShiftsForDate(rows);

  const openShift = shifts.find((s) => !s.clockOut) ?? null;

  // Shifts that already finished earlier today are "banked" — the frontend
  // only needs to live-tick the currently open one on top of this.
  const totalSecondsEarlierToday = await sumClockedSeconds(shifts.filter((s) => s !== openShift));

  const status: "idle" | "running" | "paused" = !openShift
    ? "idle"
    : openShift.pauses.some((p) => p.pause && !p.resume)
      ? "paused"
      : "running";

  const openPauses = openShift?.pauses ?? [];

  return {
    status,
    employeeId: empId,
    // Which specific shift this is, not just "is one open" — lets a client
    // tell "I was already capturing this exact shift" apart from "a shift
    // happens to be open, but I've never touched this one."
    clockId: openShift?.clockId ?? null,
    clockIn: openShift?.clockIn ?? null,
    totalSecondsEarlierToday,
    totalPauseDuration: openPauses.reduce((sum, p) => sum + (p.pauseDuration ?? 0), 0),
    pauses: openPauses.map(({ pause, resume, reason, pauseSource, pauseDuration }) => ({
      pause,
      resume,
      reason,
      pauseSource,
      pauseDuration,
    })),
    // Ground truth for the idle-prompt countdown — null/null means no
    // prompt is active. Any client derives remaining time as
    // idlePromptResponseSeconds - (now - idlePromptStartedAt).
    idlePromptStartedAt: openShift?.idlePromptStartedAt ?? null,
    idlePromptResponseSeconds: openShift?.idlePromptResponseSeconds ?? null,
  };
}

export async function clockOut(empId: number, lat: number, lng: number, io?: any) {
  const shift = await employeeDailyClockRepo.getOpenShift(empId);
  if (!shift) {
    throw new AppError("You're not clocked in.", 400);
  }
  // Whichever source opened the shift decides whether location is required
  // on the way out too — not a client-supplied flag, so it can't be spoofed.
  const coords = parseCoordinates(lat, lng, shift.source as 'web' | 'desktop');

  // Clocking out while on a break (most commonly: closing the desktop app
  // during an idle auto-pause instead of resuming first) used to leave that
  // pause with no resume time forever — duration math already fell back to
  // clock_out for it, but the raw row looked permanently "ongoing" on a
  // shift that had already ended. Resolving it here keeps the data itself
  // consistent, not just whatever happens to read it correctly today.
  const pauses = await employeeDailyClockRepo.getPauseRow(shift.id);
  const openPause = pauses.find((p) => p.pause && !p.resume);
  if (openPause) {
    await employeeDailyClockRepo.addResume(openPause.id, shift.id);
  }

  const result = await employeeDailyClockRepo.addClockOut(shift.id, coords);
  notifyClockSync(empId, io);
  return result;
}

export async function pause(empId: number, reason: string, source: 'manual' | 'idle_auto' = 'manual', io?: any) {
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

  const result = await employeeDailyClockRepo.addPause(shift.id, empId, reason, source);
  // Being paused answers the "still working?" question either way — an
  // idle-triggered pause means no, a manual one means the question doesn't
  // even apply anymore. Either way the prompt shouldn't keep counting down
  // on any other connected device.
  if (shift.idlePromptStartedAt) {
    await employeeDailyClockRepo.clearIdlePrompt(shift.id);
    io?.to(`user:${empId}`).emit('tracker:idle-sync', { idlePromptStartedAt: null, idlePromptResponseSeconds: null });
  }
  notifyClockSync(empId, io);
  return result;
}

// Ground truth write for the idle-prompt countdown (see schema.ts) — any
// client, connected or not at this exact moment, can always derive current
// state from GET /clock. The socket emit below is purely a low-latency
// nudge so already-connected clients don't have to wait for their next poll.
export async function startIdlePrompt(empId: number, responseSeconds: number, io?: any) {
  const shift = await employeeDailyClockRepo.getOpenShift(empId);
  if (!shift) {
    throw new AppError("You're not clocked in.", 400);
  }
  const idlePromptStartedAt = await employeeDailyClockRepo.setIdlePrompt(shift.id, responseSeconds);
  io?.to(`user:${empId}`).emit('tracker:idle-sync', { idlePromptStartedAt, idlePromptResponseSeconds: responseSeconds });
}

// Explicit "Yes, I'm here" — from desktop or web, doesn't matter which;
// whichever device's local timer is also counting down gets told to stop
// via the same nudge.
export async function confirmIdlePrompt(empId: number, io?: any) {
  const shift = await employeeDailyClockRepo.getOpenShift(empId);
  if (!shift) {
    throw new AppError("You're not clocked in.", 400);
  }
  await employeeDailyClockRepo.clearIdlePrompt(shift.id);
  io?.to(`user:${empId}`).emit('tracker:idle-sync', { idlePromptStartedAt: null, idlePromptResponseSeconds: null });
}

export async function resume(empId: number, io?: any) {
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

  const result = await employeeDailyClockRepo.addResume(openPause.id, shift.id);
  notifyClockSync(empId, io);
  return result;
}

export async function closeStaleOpenShifts(): Promise<number> {
  return await employeeDailyClockRepo.closeStaleOpenShifts();
}

export async function getActiveNow() {
  const [data, isLate] = await Promise.all([
    employeeDailyClockRepo.getTodayActivity(),
    buildLateChecker(),
  ]);
  const shifts = groupByClockId(data);

  // A split-shift day can have several shift rows for the same employee —
  // the roster shows each person exactly once, not once per shift.
  const shiftsByEmployee = new Map<number, typeof shifts>();
  for (const shift of shifts) {
    const list = shiftsByEmployee.get(shift.employeeId) ?? [];
    list.push(shift);
    shiftsByEmployee.set(shift.employeeId, list);
  }

  return Array.from(shiftsByEmployee.values()).map((employeeShifts) => {
    const openShift = employeeShifts.find((s) => s.clockOut == null);
    if (openShift) {
      const status: 'paused' | 'running' = openShift.pauses.some((p) => p.pause && !p.resume) ? 'paused' : 'running';
      return {
        employeeId: openShift.employeeId,
        name: openShift.name,
        clockId: openShift.clockId,
        clockIn: openShift.clockIn,
        clockOut: null,
        clockDate: openShift.clockDate,
        pauses: openShift.pauses,
        status,
        isLate: isLate(openShift.clockIn, openShift.clockDate),
        totalSeconds: null as number | null,
      };
    }

    // Every shift today is closed for this employee — summarize across all
    // of them instead of just the most recent, in case they split the day
    // into more than one session.
    const earliestShift = employeeShifts.reduce((a, b) => (new Date(a.clockIn) < new Date(b.clockIn) ? a : b));
    const latestShift = employeeShifts.reduce((a, b) => (new Date(a.clockOut!) > new Date(b.clockOut!) ? a : b));
    const totalSeconds = employeeShifts.reduce((sum, s) => {
      const pauseTotal = s.pauses.reduce((pSum, p) => pSum + (p.pauseDuration ?? 0), 0);
      const seconds = Math.floor((new Date(s.clockOut!).getTime() - new Date(s.clockIn).getTime()) / 1000);
      return sum + Math.max(0, seconds - pauseTotal);
    }, 0);

    return {
      employeeId: latestShift.employeeId,
      name: latestShift.name,
      clockId: latestShift.clockId,
      clockIn: latestShift.clockIn,
      clockOut: latestShift.clockOut,
      clockDate: latestShift.clockDate,
      pauses: [],
      status: 'done' as const,
      isLate: isLate(earliestShift.clockIn, earliestShift.clockDate),
      totalSeconds,
    };
  });
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

  // A closed desktop shift's recorded total is the verified (screenshot-
  // backed) time, not raw clocked time — matches the Upwork-style policy
  // that only evidenced time counts. Still-running shifts keep ticking on
  // raw clocked time since their segments haven't all flushed yet; web
  // shifts never run the tracker, so raw clocked time is all there is.
  const closedDesktopClockIds = data
    .filter((record) => record.source === "desktop" && record.clockOut)
    .map((record) => record.clockId);
  const verifiedSecondsByClockId = await trackerService.getVerifiedSecondsByClockIds(closedDesktopClockIds);

   const now = Date.now();
   const result = data.map((record) => {
     const totalPauseDuration = record.pauses.reduce(
       (sum, p) => sum + (p.pauseDuration ?? 0),
       0,
     );

     const start = new Date(record.clockIn).getTime();
     const end = record.clockOut ? new Date(record.clockOut).getTime() : now;
     const grossSeconds = Math.floor((end - start) / 1000);

     const totalClockInDuration = record.source === "desktop" && record.clockOut
       ? verifiedSecondsByClockId.get(record.clockId) ?? 0
       : Math.max(0, grossSeconds - totalPauseDuration);

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