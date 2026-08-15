import { Response } from 'express';
import * as meetingService from '../services/meeting.service';
import * as meetingDto from '../dtos/meeting.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: any, res: Response) => {
  const rows = await meetingService.list();
  res.json(rows);
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = meetingDto.toCreateInput(req.body);
  const result = await meetingService.create(input, req.user.id);
  res.status(201).json(result);
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await meetingService.remove(req.params.id, req.user);
  res.json({ success: true });
});
