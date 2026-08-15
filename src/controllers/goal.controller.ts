import { Request, Response } from 'express';
import * as goalService from '../services/goal.service';
import * as goalDto from '../dtos/goal.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const list = asyncHandler(async (req: any, res: Response) => {
  const { employee_id, status, category } = req.query;
  const rows = await goalService.list(req.user, employee_id, status, category);
  res.json(rows);
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const rows = await goalService.summary();
  res.json(rows);
});

export const create = asyncHandler(async (req: any, res: Response) => {
  // Which employee_id this goal is for depends on the caller's role — this
  // authorization decision has to run before the DTO can validate
  // employee_id, so it stays here rather than inside goal.dto.ts.
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const employeeId = privileged ? req.body.employee_id || req.user.id : req.user.id;

  if (!privileged && Number(req.body.employee_id) !== req.user.id && req.body.employee_id) {
    throw new AppError('You can only create goals for yourself', 403);
  }

  const input = goalDto.toCreateInput({ ...req.body, employee_id: employeeId }, req.user.id);
  const id = await goalService.create(input);
  res.status(201).json({ id });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = goalDto.toUpdateInput(req.body);
  await goalService.update(req.params.id, input, req.user);
  res.json({ success: true });
});

export const updateProgress = asyncHandler(async (req: any, res: Response) => {
  const input = goalDto.toProgressInput(req.body);
  await goalService.updateProgress(req.params.id, input, req.user);
  res.json({ success: true });
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await goalService.remove(req.params.id, req.user);
  res.json({ success: true });
});
