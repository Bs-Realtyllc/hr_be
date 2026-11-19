import AppError from '../pkg/AppError';
import * as employeeDailyClockRepo from '../repositories/clock.repository';
import { TrackerActivityBlock } from '../db/mongo/trackerActivityBlock';
import { TrackerScreenshot } from '../db/mongo/trackerScreenshot';
import { uploadScreenshotToMinio, streamScreenshotFromMinio } from './minio.service';
import { signMediaToken } from '../middleware/auth';

/** Every tracker write resolves the caller's own open shift server-side —
 *  never trust a client-supplied clockId, or one employee could attribute
 *  activity to another's session. */
async function getOpenClockOrThrow(employeeId: number) {
  const openShift = await employeeDailyClockRepo.getOpenShift(employeeId);
  if (!openShift) {
    throw new AppError('Not clocked in — start a shift before sending tracker data', 409);
  }
  return openShift;
}

export interface ActivityInput {
  windowStart:   string;
  windowEnd:     string;
  activeSeconds: number;
  idleSeconds:   number;
  keyPresses?:   number;
  mouseClicks?:  number;
  mouseMoves?:   number;
  activeAppName?: string | null;
}

export async function recordActivity(employeeId: number, input: ActivityInput) {
  const openShift = await getOpenClockOrThrow(employeeId);

  const block = await TrackerActivityBlock.create({
    clockId:       openShift.id,
    employeeId,
    windowStart:   new Date(input.windowStart),
    windowEnd:     new Date(input.windowEnd),
    activeSeconds: input.activeSeconds,
    idleSeconds:   input.idleSeconds,
    keyPresses:    input.keyPresses ?? 0,
    mouseClicks:   input.mouseClicks ?? 0,
    mouseMoves:    input.mouseMoves ?? 0,
    activeAppName: input.activeAppName ?? null,
  });

  return { id: block.id, clockId: openShift.id };
}

export interface ScreenshotInput {
  buffer:        Buffer;
  mimetype:      string;
  capturedAt:    string;
  activeSeconds?: number;
  idleSeconds?:   number;
}

export async function saveScreenshot(employeeId: number, input: ScreenshotInput) {
  const openShift = await getOpenClockOrThrow(employeeId);

  const key = await uploadScreenshotToMinio(input.buffer, input.mimetype);

  const screenshot = await TrackerScreenshot.create({
    clockId:       openShift.id,
    employeeId,
    capturedAt:    new Date(input.capturedAt),
    minioObjectKey: key,
    activeSeconds: input.activeSeconds ?? 0,
    idleSeconds:   input.idleSeconds ?? 0,
  });

  return {
    id: screenshot.id,
    key,
    // Same short-lived signed-link pattern as inbox audio — the diary view
    // can embed this directly in an <img> without an Authorization header.
    url: `/tracker/screenshots/${encodeURIComponent(key)}?token=${signMediaToken(key)}`,
  };
}

export async function streamScreenshot(key: string) {
  return streamScreenshotFromMinio(key);
}

export async function getDiary(employeeId: number, date: string) {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd   = new Date(`${date}T23:59:59.999Z`);

  const [activityBlocks, screenshots] = await Promise.all([
    TrackerActivityBlock.find({
      employeeId,
      windowStart: { $gte: dayStart, $lte: dayEnd },
    }).sort({ windowStart: 1 }).lean(),
    TrackerScreenshot.find({
      employeeId,
      capturedAt: { $gte: dayStart, $lte: dayEnd },
    }).sort({ capturedAt: 1 }).lean(),
  ]);

  return {
    employeeId,
    date,
    activityBlocks,
    screenshots: screenshots.map((s) => ({
      ...s,
      url: `/tracker/screenshots/${encodeURIComponent(s.minioObjectKey)}?token=${signMediaToken(s.minioObjectKey)}`,
    })),
  };
}
