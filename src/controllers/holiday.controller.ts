import { Request, Response } from 'express';
import * as holidayService from '../services/holiday.service';
import * as holidayDto from '../dtos/holiday.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rows = await holidayService.list(req.query.year as string | undefined);
  res.json(holidayDto.toResponseList(rows));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = holidayDto.toCreateInput(req.body);
  const id = await holidayService.create(input, req.user?.id ?? null);
  res.status(201).json({ id });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await holidayService.remove(req.params.id);
  res.json({ success: true });
});
