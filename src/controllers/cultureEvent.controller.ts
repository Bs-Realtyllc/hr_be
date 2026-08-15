import { Request, Response } from 'express';
import * as cultureEventService from '../services/cultureEvent.service';
import * as cultureEventDto from '../dtos/cultureEvent.dto';
import asyncHandler from '../middleware/asyncHandler';

export const upcoming = asyncHandler(async (req: Request, res: Response) => {
  const rows = await cultureEventService.upcoming();
  res.json(cultureEventDto.toResponseList(rows));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rows = await cultureEventService.list();
  res.json(cultureEventDto.toResponseList(rows));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = cultureEventDto.toCreateInput(req.body);
  const id = await cultureEventService.create(input, req.user?.id ?? null);
  res.status(201).json({ id });
});
