import AppError from "../pkg/AppError";
import * as employeeDailyClockRepo from "../repositories/clock.repository";
export async function clockIn(empId: number) {
  const hour = new Date().getHours();
  if (hour < 8 || hour >= 24) {
    throw new AppError("Clock-in is only allowed between 8 AM and 5 PM.", 400);
  }
  return await employeeDailyClockRepo.addClockIn(empId);
}

export async function getClock(empId: number, date: string) {
  const today = date || new Date().toISOString().split("T")[0];
  return await employeeDailyClockRepo.getClock(empId, today);
}

export async function clockOut(empId: number) {
  const existing = await employeeDailyClockRepo.getClock(
    empId,
    new Date().toISOString().split("T")[0],
  );
  if (!existing) {
    throw new AppError("You haven't clocked in today.", 400);
  }
  if (existing.clockOut) {
    throw new AppError("You have already clocked out today.", 409);
  }
  return await employeeDailyClockRepo.addClockOut(empId);
}

export async function pause(empId: number, reason: string) {
  const today = new Date().toISOString().split("T")[0];
  const record = await employeeDailyClockRepo.getClock(empId, today);

  if (!record) {
    throw new AppError("You haven't clocked in today.", 400);
  }
  if (record.clockOut) {
    throw new AppError("You have already clocked out today.", 409);
  }
  if (record.pause) {
    throw new AppError("You have already paused today.", 409);
  }
  if (!reason?.trim())
    throw new AppError("Cannot pause clock without valid reason", 400);

  return await employeeDailyClockRepo.addPause(empId, reason);
}

export async function resume(empId: number) {
  const today = new Date().toISOString().split("T")[0];
  const record = await employeeDailyClockRepo.getClock(empId, today);

  if (!record) {
    throw new AppError("You haven't clocked in today.", 400);
  }
  if (!record.pause) {
    throw new AppError("You need to pause before resuming.", 400);
  }
  if (record.resume) {
    throw new AppError("You have already resumed today.", 409);
  }

  const now = new Date();
  if (now < new Date(record.pause)) {
    // defensive only — should be structurally impossible since `now` is always
    // later than a previously-stored `pause`, but guards against clock skew
    throw new AppError("Resume time cannot be before pause time.", 400);
  }

  return await employeeDailyClockRepo.addResume(empId);
}
