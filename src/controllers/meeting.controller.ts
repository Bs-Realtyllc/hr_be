import { Response } from 'express';
import * as meetingService from '../services/meeting.service';
import * as meetingDto from '../dtos/meeting.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: any, res: Response) => {
  const rows = await meetingService.list(meetingDto.toRange(req.query));
  res.json(meetingDto.toResponseList(rows));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = meetingDto.toCreateInput(req.body);
  const row = await meetingService.create(input, req.user.id);
  res.status(201).json(meetingDto.toResponse(row));
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = meetingDto.toUpdateInput(req.body);
  const row = await meetingService.update(req.params.id, input, req.user);
  res.json(meetingDto.toResponse(row));
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await meetingService.remove(req.params.id, req.user);
  res.json({ success: true });
});
