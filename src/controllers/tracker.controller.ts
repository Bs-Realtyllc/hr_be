import { Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import * as trackerService from '../services/tracker.service';

export const recordActivity = asyncHandler(async (req: any, res: Response) => {
  const result = await trackerService.recordActivity(req.user.id, req.body);
  res.status(201).json(result);
});

export const uploadScreenshot = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) throw Object.assign(new Error('No screenshot uploaded'), { status: 400 });
  const { capturedAt, activeSeconds, idleSeconds } = req.body;
  const result = await trackerService.saveScreenshot(req.user.id, {
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    capturedAt,
    activeSeconds: activeSeconds ? Number(activeSeconds) : undefined,
    idleSeconds: idleSeconds ? Number(idleSeconds) : undefined,
  });
  res.status(201).json(result);
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
    if (err?.code === 'NoSuchKey' || err?.message?.includes('NoSuchKey')) {
      throw Object.assign(new Error('Screenshot not found'), { status: 404 });
    }
    throw err;
  }
});

export const getDiary = asyncHandler(async (req: any, res: Response) => {
  const employeeId = Number(req.query.employeeId);
  const date = req.query.date as string;
  if (!employeeId || !date) {
    throw Object.assign(new Error('employeeId and date are required'), { status: 400 });
  }
  const result = await trackerService.getDiary(employeeId, date);
  res.status(200).json(result);
});

export const getMyDiary = asyncHandler(async (req: any, res: Response) => {
  const date = req.query.date as string;
  if (!date) throw Object.assign(new Error('date is required'), { status: 400 });
  const result = await trackerService.getDiary(req.user.id, date);
  res.status(200).json(result);
});
