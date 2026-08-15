import { Response } from 'express';
import * as feedbackService from '../services/feedback.service';
import * as feedbackDto from '../dtos/feedback.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const list = asyncHandler(async (req: any, res: Response) => {
  const { type } = req.query;
  const scope = req.query.scope || 'public';
  const rows = await feedbackService.list(req.user, scope, req.query.employee_id, type);
  res.json(rows);
});

export const summary = asyncHandler(async (req: any, res: Response) => {
  const rows = await feedbackService.summary();
  res.json(rows);
});

export const create = asyncHandler(async (req: any, res: Response) => {
  // Manual checks before DTO binding — matches the original's error
  // precedence (these two checks run before the DTO's own validation).
  if (!req.body.message?.trim()) {
    throw new AppError('Message is required', 400);
  }
  if (Number(req.body.to_employee_id) === req.user.id) {
    throw new AppError('You cannot send feedback to yourself', 400);
  }
  const input = feedbackDto.toCreateInput(req.body, req.user.id);
  const id = await feedbackService.create(input);
  res.status(201).json({ id });
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await feedbackService.remove(req.params.id, req.user);
  res.json({ success: true });
});
