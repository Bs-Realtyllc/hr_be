import { Request, Response } from 'express';
import * as positionService from '../services/position.service';
import * as positionDto from '../dtos/position.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rows = await positionService.list();
  res.json(positionDto.toResponseList(rows));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = positionDto.toCreateInput(req.body);
  const id = await positionService.create(input);
  res.status(201).json({ id });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = positionDto.toUpdateInput(req.body);
  await positionService.update(req.params.id, input);
  res.json({ success: true });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  await positionService.deactivate(req.params.id);
  res.json({ success: true });
});
