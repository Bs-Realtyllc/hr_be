import AppError from '../pkg/AppError';
import * as employeeDailyClockRepo from '../repositories/clock.repository';
import { TrackerSegment } from '../db/mongo/trackerSegment';
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

export interface SegmentInput {
  windowStart:   string;
  windowEnd:     string;
  activeSeconds: number;
  idleSeconds:   number;
  // One entry per minute of the segment — true if that minute had any input.
  activeMinutes?: boolean[];
  keyPresses?:   number;
  mouseClicks?:  number;
  mouseMoves?:   number;
  activeAppName?: string | null;
  // Present only when a screenshot was actually captured for this segment —
  // capture can fail (permissions, timing) without losing the segment's time.
  capturedAt?:   string;
  screenshot?:   { buffer: Buffer; mimetype: string } | null;
  // True when this segment was cut short by the idle prompt timing out
  // with no response, rather than running its normal full length.
  idleTriggered?: boolean;
}

export async function recordSegment(employeeId: number, input: SegmentInput, apiBase: string) {
  const openShift = await getOpenClockOrThrow(employeeId);

  const windowStart = new Date(input.windowStart);
  const windowEnd = new Date(input.windowEnd);

  // Two devices can end up capturing the same open shift at once (someone
  // clocks in on the desktop app, then also confirms "start tracking" on a
  // second machine). Same policy Time Doctor documents for this exact case:
  // whichever segment already covers a given stretch of time wins; a
  // later-arriving segment overlapping it is kept for audit but excluded
  // from verified/total time, so the same real minute is never credited
  // twice.
  const overlapping = await TrackerSegment.exists({
    clockId: openShift.id,
    windowStart: { $lt: windowEnd },
    windowEnd: { $gt: windowStart },
  });

  const minioObjectKey = input.screenshot
    ? await uploadScreenshotToMinio(input.screenshot.buffer, input.screenshot.mimetype)
    : null;

  const segment = await TrackerSegment.create({
    clockId:       openShift.id,
    employeeId,
    windowStart,
    windowEnd,
    activeSeconds: input.activeSeconds,
    idleSeconds:   input.idleSeconds,
    // Empty (not a fake all-false array) when the client didn't send
    // per-minute data — lets the diary tell "no data recorded" apart from
    // "recorded, genuinely idle the whole segment."
    activeMinutes: input.activeMinutes ?? [],
    keyPresses:    input.keyPresses ?? 0,
    mouseClicks:   input.mouseClicks ?? 0,
    mouseMoves:    input.mouseMoves ?? 0,
    activeAppName: input.activeAppName ?? null,
    capturedAt:    input.capturedAt ? new Date(input.capturedAt) : null,
    minioObjectKey,
    excluded:      Boolean(overlapping),
    idleTriggered: input.idleTriggered ?? false,
  });

  return {
    id: segment.id,
    clockId: openShift.id,
    // Same short-lived signed-link pattern as inbox audio — the diary view
    // can embed this directly in an <img> without an Authorization header.
    screenshotUrl: minioObjectKey
      ? `${apiBase}/tracker/screenshots/${encodeURIComponent(minioObjectKey)}?token=${signMediaToken(minioObjectKey)}`
      : null,
  };
}

export async function streamScreenshot(key: string) {
  return streamScreenshotFromMinio(key);
}

export async function getDiary(employeeId: number, clockId: number, apiBase: string) {
  // Scoped strictly to one shift — employeeId stays in the query even
  // though clockId alone would already narrow it down, so a clockId that
  // doesn't actually belong to this employeeId just returns nothing rather
  // than leaking someone else's shift (matters for the self-service /me
  // route, where clockId comes straight from the caller).
  const segments = await TrackerSegment.find({ employeeId, clockId }).sort({ windowStart: 1 }).lean();

  const entries = segments.map((segment) => ({
    segment,
    screenshot: segment.minioObjectKey
      ? {
          id: String(segment._id),
          capturedAt: segment.capturedAt,
          url: `${apiBase}/tracker/screenshots/${encodeURIComponent(segment.minioObjectKey)}?token=${signMediaToken(segment.minioObjectKey)}`,
        }
      : null,
  }));

  // "Verified" means evidence actually exists right now — not just "wasn't
  // explicitly deleted." A segment that never got a screenshot in the first
  // place (capture failure, or the shift ended before the randomized
  // capture timer fired) has exactly as little evidence behind it as one
  // whose screenshot was deleted, so both are excluded the same way. An
  // excluded segment (deleted, or discarded as a second device's overlap
  // with an already-synced one) never counts toward either total.
  const countableSegments = segments.filter((s) => !s.excluded);
  const verifiedActiveSeconds = countableSegments
    .filter((s) => s.minioObjectKey)
    .reduce((sum, s) => sum + s.activeSeconds, 0);
  const totalActiveSeconds = countableSegments.reduce((sum, s) => sum + s.activeSeconds, 0);

  return { employeeId, clockId, entries, verifiedActiveSeconds, totalActiveSeconds };
}

/** Deletes the screenshot backing one segment (self, or admin/lead for
 *  anyone). A segment has exactly one screenshot, so losing it always
 *  means the whole segment goes unverified. */
export async function deleteScreenshot(requester: { id: number; role: string }, segmentId: string) {
  const segment = await TrackerSegment.findById(segmentId);
  if (!segment || !segment.minioObjectKey) throw new AppError('Screenshot not found', 404);

  const isOwner = segment.employeeId === requester.id;
  const isReviewer = requester.role === 'admin' || requester.role === 'lead';
  if (!isOwner && !isReviewer) {
    throw new AppError('Not allowed to delete this screenshot', 403);
  }

  await deleteScreenshotFromMinio(segment.minioObjectKey);
  segment.minioObjectKey = null;
  segment.excluded = true;
  segment.excludedAt = new Date();
  segment.excludedBy = requester.id;
  await segment.save();

  return { deleted: true, segmentExcluded: true };
}

/** Sum of activeSeconds across screenshot-backed segments, batched across
 *  several shifts at once — one Mongo round trip for a whole attendance
 *  page instead of one per row. Excludes deleted segments and segments
 *  discarded as a second device's overlap with one already synced. */
export async function getVerifiedSecondsByClockIds(clockIds: number[]): Promise<Map<number, number>> {
  const totals = new Map<number, number>();
  if (clockIds.length === 0) return totals;

  const segments = await TrackerSegment.find(
    { clockId: { $in: clockIds }, minioObjectKey: { $ne: null }, excluded: { $ne: true } },
    { clockId: 1, activeSeconds: 1 },
  ).lean();

  for (const s of segments) {
    totals.set(s.clockId, (totals.get(s.clockId) ?? 0) + s.activeSeconds);
  }
  return totals;
}
