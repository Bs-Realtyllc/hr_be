import { Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import * as trackerService from '../services/tracker.service';

function apiBaseFor(req: any) {
  return process.env.API_BASE_URL ?? `${req.protocol}://${req.get('host')}/api`;
}

// One call per segment — screenshot is optional (capture can fail
// client-side without losing the segment's activity stats).
export const recordSegment = asyncHandler(async (req: any, res: Response) => {
  const {
    windowStart, windowEnd, activeSeconds, idleSeconds,
    activeMinutes, keyPresses, mouseClicks, mouseMoves,
    activeAppName, capturedAt, idleTriggered,
  } = req.body;

  const result = await trackerService.recordSegment(req.user.id, {
    windowStart,
    windowEnd,
    activeSeconds: Number(activeSeconds),
    idleSeconds: Number(idleSeconds),
    activeMinutes: activeMinutes ? JSON.parse(activeMinutes) : undefined,
    keyPresses: keyPresses ? Number(keyPresses) : undefined,
    mouseClicks: mouseClicks ? Number(mouseClicks) : undefined,
    mouseMoves: mouseMoves ? Number(mouseMoves) : undefined,
    activeAppName: activeAppName || null,
    capturedAt: capturedAt || undefined,
    screenshot: req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : null,
    idleTriggered: idleTriggered === 'true',
  }, apiBaseFor(req));

  res.status(201).json(result);
});

export const deleteScreenshot = asyncHandler(async (req: any, res: Response) => {
  const result = await trackerService.deleteScreenshot(
    { id: req.user.id, role: req.user.role },
    req.params.id,
  );
  res.status(200).json(result);
});

export const streamScreenshot = asyncHandler(async (req: any, res: Response) => {
  const key = req.params.key as string;
  if (!key || key.includes('..') || key.includes('/')) {
    throw Object.assign(new Error('Invalid screenshot key'), { status: 400 });
  }
  try {
    const { stream, size, contentType } = await trackerService.streamScreenshot(key);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', size);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    stream.pipe(res);
  } catch (err: any) {
    if (err?.code === 'NotFound' || err?.code === 'NoSuchKey') {
      throw Object.assign(new Error('Screenshot not found'), { status: 404 });
    }
    throw err;
  }
});

export const getDiary = asyncHandler(async (req: any, res: Response) => {
  const employeeId = Number(req.query.employeeId);
  const clockId = Number(req.query.clockId);
  if (!employeeId || !clockId) {
    throw Object.assign(new Error('employeeId and clockId are required'), { status: 400 });
  }
  const result = await trackerService.getDiary(employeeId, clockId, apiBaseFor(req));
  res.status(200).json(result);
});

export const getMyDiary = asyncHandler(async (req: any, res: Response) => {
  const clockId = Number(req.query.clockId);
  if (!clockId) throw Object.assign(new Error('clockId is required'), { status: 400 });
  const result = await trackerService.getDiary(req.user.id, clockId, apiBaseFor(req));
  res.status(200).json(result);
});
