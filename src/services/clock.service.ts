import AppError from "../pkg/AppError";
import * as employeeDailyClockRepo from "../repositories/clock.repository";

type ClockStatus = "idle" | "running" | "paused" | "done";

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
  email: string;
  address: string;
  profilePicture: string | null;
  phone: string | null;
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
  email: string;
  address: string;
  profilePicture: string | null;
  phone: string | null;
  clockId: number;
  clockIn: Date | string;
  clockOut: Date | string | null;
  clockDate: string;
  pauses: { pause: Date | string | null; resume: Date | string | null; reason: string | null, pauseDuration: number | null }[];
}

function deriveStatus(rows): ClockStatus {
  if (rows.length === 0) return "idle"; // no clock-in record at all today — treat as not clocked in

  const { clockOut } = rows[0]; // same across all rows for this clock session

  if (clockOut) return "done";

  const isCurrentlyPaused = rows.some((r) => r.pause && !r.resume);
  return isCurrentlyPaused ? "paused" : "running";
}

function groupByClockId(rows: RawRow[]): GroupedClockRecord[] {
  const map = new Map<number, GroupedClockRecord>();

  for (const row of rows) {
    const {
      employeeId,
      name,
      email,
      address,
      profilePicture,
      phone,
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
        email,
        address,
        profilePicture,
        phone,
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


export async function clockIn(empId: number) {
  const hour = new Date().getHours();
  if (hour < 8 || hour >= 24) {
    throw new AppError("Clock-in is only allowed between 8 AM and 5 PM.", 400);
  }
  return await employeeDailyClockRepo.addClockIn(empId);
}

export async function getClock(empId: number, date: string) {
  const today = date || new Date().toISOString().split("T")[0];
  const result = await employeeDailyClockRepo.getClock(empId, today);

  let totalPauseDuration = 0;
  result.map((data)=>{totalPauseDuration += data.pauseDuration})

  return {
    status: deriveStatus(result),
    clockIn: result[0]?.clockIn ?? null,
    clockOut: result[0]?.clockOut ?? null,
    totalPauseDuration,
    employeeId: result[0]?.employeeId ?? null,
    pauses: result.map(({ id, pause, resume, reason, pauseDuration }) => ({
      id,
      pause,
      resume,
      reason,
      pauseDuration,
    })),
  };
}

export async function clockOut(empId: number) {
  const existing = await employeeDailyClockRepo.getClock(
    empId,
    new Date().toISOString().split("T")[0],
  );
  if (!existing) {
    throw new AppError("You haven't clocked in today.", 400);
  }
  if (existing.some((r) => r.clockIn && r.clockOut)) {
    throw new AppError("You have already clocked out today.", 409);
  }
  return await employeeDailyClockRepo.addClockOut(empId);
}

export async function pause(empId: number, reason: string) {
  const today = new Date().toISOString().split("T")[0];
  const record = await employeeDailyClockRepo.getClock(empId, today);
  const isClockedOut = record.some((r)=> r.clockOut)
  const isPaused = record.some((r)=> r.pause && !r.resume);
  const clockId = record[0].clock_id;

  // console.log(record, isClockedOut, isPaused);

  if (!record) {
    throw new AppError("You haven't clocked in today.", 400);
  }
  if (isClockedOut) {
    throw new AppError("You have already clocked out today.", 409);
  }
    if (isPaused) {
    throw new AppError("You have already paused the timer", 400);
  }
  if (!reason?.trim())
    throw new AppError("Cannot pause clock without valid reason", 400);

  return await employeeDailyClockRepo.addPause(clockId, empId, reason);
}

export async function resume(empId: number) {
  const today = new Date().toISOString().split("T")[0];
  const record = await employeeDailyClockRepo.getClock(empId, today);
  const isClockedOut = record.some((r)=>r.employeeId=== empId && r.clockOut)
  const isPaused = record.some((r)=>r.employeeId ===empId && r.pause && !r.resume);
  // console.log(record, isClockedOut, isPaused)
  
  if (!record) {
    throw new AppError("You haven't clocked in today.", 400);
  }
  if (isClockedOut) {
    throw new AppError("You have already clocked out today.", 409);
  }
    if (!isPaused) {
    throw new AppError("You have not paused the clock.", 400);
  }
  const [filteredRecord] = record.filter((r)=> r.pause && !r.resume)
  // console.log(filteredRecord)

  const now = new Date();
  if (now < new Date(filteredRecord.pause)) {
    throw new AppError("Resume time cannot be before pause time.", 400);
  }

  return await employeeDailyClockRepo.addResume(filteredRecord.id, filteredRecord.clock_id);
}


export async function getAllForToday( date: string) {
  const today = date || new Date().toISOString().split("T")[0];
  const data = await employeeDailyClockRepo.getAllForToday(today);
  const grouped = groupByClockId(data);
  const result = grouped.map((row) => {
    let status: 'done' | 'paused' | 'running' = 'running';

    if (row.clockOut) {
      status = 'done';
    } else if (row.pauses?.some((r) => r.pause && !r.resume)) {
      status = 'paused';
    }

    return {
      ...row,
      status,
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
 
  const { data, total, page, limit } =
    await employeeDailyClockRepo.getAttendance(filters);
 
  // groupByClockId is no longer needed here — the repo already returns
  // one entry per clock record with its pauses embedded, correctly paginated.
  const result = data.map((record) => {
    const totalPauseDuration = record.pauses.reduce(
      (sum, p) => sum + (p.pauseDuration ?? 0),
      0,
    );
    return { ...record, totalPauseDuration };
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