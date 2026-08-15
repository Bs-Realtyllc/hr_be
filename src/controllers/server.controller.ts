import { Request, Response } from 'express';
import * as serverService from '../services/server.service';
import * as serverDto from '../dtos/server.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { project_id, show_sensitive } = req.query;
  const rows = await serverService.list(project_id as string | undefined);
  res.json(serverDto.toResponseList(rows, show_sensitive === 'true'));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = serverDto.toCreateInput(req.body);
  const id = await serverService.create(input, req.user?.id ?? null);
  res.status(201).json({ id });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = serverDto.toUpdateInput(req.body);
  await serverService.update(req.params.id, input, req.user?.id ?? null);
  res.json({ success: true });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await serverService.remove(req.params.id);
  res.json({ success: true });
});
