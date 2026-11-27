import { Request, Response } from 'express';
import * as calendarEventService from '../services/calendarEvent.service';
import * as calendarEventDto from '../dtos/calendarEvent.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rows = await calendarEventService.list(calendarEventDto.toRange(req.query));
  res.json(calendarEventDto.toResponseList(rows));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const row = await calendarEventService.getById(req.params.id);
  res.json(calendarEventDto.toResponse(row));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = calendarEventDto.toInput(req.body);
  const row = await calendarEventService.create(input, req.user.id);
  res.status(201).json(calendarEventDto.toResponse(row));
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = calendarEventDto.toInput(req.body);
  const row = await calendarEventService.update(req.params.id, input, req.user.id);
  res.json(calendarEventDto.toResponse(row));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await calendarEventService.remove(req.params.id);
  res.json({ success: true });
});
