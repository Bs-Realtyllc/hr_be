import { Response } from 'express';
import * as standupService from '../services/standup.service';
import * as standupDto from '../dtos/standup.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: any, res: Response) => {
  const { date, start_date, end_date, employee_id } = req.query;
  const rows = await standupService.list(req.user, employee_id, date, start_date, end_date);
  res.json(standupDto.toResponseList(rows));
});

export const today = asyncHandler(async (req: any, res: Response) => {
  const rows = await standupService.today(req.user);
  res.json(standupDto.toResponseList(rows));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = standupDto.toCreateInput(req.body);
  const id = await standupService.create(input, req.user?.id ?? null);
  res.status(201).json({ id });
});
