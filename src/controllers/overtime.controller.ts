import { Response } from 'express';
import * as overtimeService from '../services/overtime.service';
import * as overtimeDto from '../dtos/overtime.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: any, res: Response) => {
  const { employee_id, status } = req.query;
  const rows = await overtimeService.list(req.user, employee_id, status);
  res.json(overtimeDto.toResponseList(rows));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = overtimeDto.toCreateInput(req.body, req.user.id);
  const id = await overtimeService.create(input, req.user.role);
  res.status(201).json({ id });
});

export const approve = asyncHandler(async (req: any, res: Response) => {
  const { amount } = await overtimeService.approve(req.params.id, req.user);
  res.json({ success: true, amount });
});

export const reject = asyncHandler(async (req: any, res: Response) => {
  await overtimeService.reject(req.params.id, req.user);
  res.json({ success: true });
});

export const reconcile = asyncHandler(async (req: any, res: Response) => {
  const { actualHours, amount, clockedSecondsEstimated } = await overtimeService.reconcile(req.params.id, req.user);
  res.json({ success: true, actual_hours: actualHours, amount, clocked_seconds_estimated: clockedSecondsEstimated });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  await overtimeService.update(req.params.id, req.body, req.user.id);
  res.json({ success: true });
});

export const cancel = asyncHandler(async (req: any, res: Response) => {
  await overtimeService.cancel(req.params.id, req.user.id);
  res.json({ success: true });
});
