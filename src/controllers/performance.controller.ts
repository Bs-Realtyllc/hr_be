import { Response } from 'express';
import * as performanceService from '../services/performance.service';
import * as performanceDto from '../dtos/performance.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const list = asyncHandler(async (req: any, res: Response) => {
  const { employee_id, status } = req.query;
  const rows = await performanceService.list(req.user, employee_id, status);
  res.json(rows);
});

export const trend = asyncHandler(async (req: any, res: Response) => {
  const rows = await performanceService.trend(req.params.employeeId, req.user);
  res.json(rows);
});

export const create = asyncHandler(async (req: any, res: Response) => {
  if (!['admin', 'lead'].includes(req.user?.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  const input = performanceDto.toCreateInput(req.body, req.user.id);
  const id = await performanceService.create(input, req.user);
  res.status(201).json({ id });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = performanceDto.toUpdateInput(req.body);
  await performanceService.update(req.params.id, input, req.user);
  res.json({ success: true });
});

export const submit = asyncHandler(async (req: any, res: Response) => {
  await performanceService.submit(req.params.id, req.user);
  res.json({ success: true });
});

export const acknowledge = asyncHandler(async (req: any, res: Response) => {
  await performanceService.acknowledge(req.params.id, req.body.employee_comments || null, req.user);
  res.json({ success: true });
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await performanceService.remove(req.params.id, req.user);
  res.json({ success: true });
});
