import AppError from '../pkg/AppError';
import * as employeeDailyClockRepo from '../repositories/clock.repository';
import { TrackerActivityBlock } from '../db/mongo/trackerActivityBlock';
import { TrackerScreenshot } from '../db/mongo/trackerScreenshot';
import { uploadScreenshotToMinio, streamScreenshotFromMinio, deleteScreenshotFromMinio } from './minio.service';
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
  // One entry per minute of the window — true if that minute had any input.
  activeMinutes?: boolean[];
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
    // Empty (not a fake all-false array) when the client didn't send
    // per-minute data — lets the diary tell "no data recorded" apart from
    // "recorded, genuinely idle the whole block."
    activeMinutes: input.activeMinutes ?? [],
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

export async function saveScreenshot(employeeId: number, input: ScreenshotInput, apiBase: string) {
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
    url: `${apiBase}/tracker/screenshots/${encodeURIComponent(key)}?token=${signMediaToken(key)}`,
  };
}

export async function streamScreenshot(key: string) {
  return streamScreenshotFromMinio(key);
}

export async function getDiary(employeeId: number, clockId: number, apiBase: string) {
  // Scoped strictly to one shift — employeeId stays in both queries even
  // though clockId alone would already narrow it down, so a clockId that
  // doesn't actually belong to this employeeId just returns nothing rather
  // than leaking someone else's shift (matters for the self-service /me
  // route, where clockId comes straight from the caller).
  const [activityBlocks, screenshots] = await Promise.all([
    TrackerActivityBlock.find({ employeeId, clockId }).sort({ windowStart: 1 }).lean(),
    TrackerScreenshot.find({ employeeId, clockId }).sort({ capturedAt: 1 }).lean(),
  ]);

  // Pair each block with every screenshot captured inside its window. A
  // block can have several screenshots (evidence density, not separate
  // time slices); it only becomes unverified once all of them are gone,
  // which recordActivity/deleteScreenshot already encodes as `excluded`.
  const entries = activityBlocks.map((block) => {
    const shots = screenshots.filter((s) =>
      s.capturedAt >= block.windowStart &&
      s.capturedAt <= block.windowEnd,
    );
    return {
      block,
      screenshots: shots.map((shot) => ({
        id: shot.id,
        capturedAt: shot.capturedAt,
        url: `${apiBase}/tracker/screenshots/${encodeURIComponent(shot.minioObjectKey)}?token=${signMediaToken(shot.minioObjectKey)}`,
      })),
    };
  });

  // "Verified" means evidence actually exists right now — not just "wasn't
  // explicitly deleted." A block that never got a screenshot in the first
  // place (capture failure, or the shift ended before the randomized
  // capture timer fired) has exactly as little evidence behind it as one
  // whose screenshot was deleted, so both are excluded the same way.
  const verifiedActiveSeconds = entries
    .filter((e) => e.screenshots.length > 0)
    .reduce((sum, e) => sum + e.block.activeSeconds, 0);
  const totalActiveSeconds = activityBlocks.reduce((sum, b) => sum + b.activeSeconds, 0);

  return { employeeId, clockId, entries, verifiedActiveSeconds, totalActiveSeconds };
}

/** Deletes one screenshot (self, or admin/lead for anyone). The parent
 *  block is only marked unverified once every screenshot backing it has
 *  been deleted — see the schema comment on `excluded` for why. */
export async function deleteScreenshot(requester: { id: number; role: string }, screenshotId: string) {
  const screenshot = await TrackerScreenshot.findById(screenshotId);
  if (!screenshot) throw new AppError('Screenshot not found', 404);

  const isOwner = screenshot.employeeId === requester.id;
  const isReviewer = requester.role === 'admin' || requester.role === 'lead';
  if (!isOwner && !isReviewer) {
    throw new AppError('Not allowed to delete this screenshot', 403);
  }

  await deleteScreenshotFromMinio(screenshot.minioObjectKey);
  await TrackerScreenshot.deleteOne({ _id: screenshot.id });

  const block = await TrackerActivityBlock.findOne({
    clockId: screenshot.clockId,
    windowStart: { $lte: screenshot.capturedAt },
    windowEnd: { $gte: screenshot.capturedAt },
  });
  if (!block) return { deleted: true, blockExcluded: false };

  const stillHasEvidence = await TrackerScreenshot.exists({
    clockId: block.clockId,
    capturedAt: { $gte: block.windowStart, $lte: block.windowEnd },
  });

  if (!stillHasEvidence) {
    block.excluded = true;
    block.excludedAt = new Date();
    block.excludedBy = requester.id;
    await block.save();
  }

  return { deleted: true, blockExcluded: !stillHasEvidence };
}
