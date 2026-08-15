import { Request, Response } from 'express';
import * as emailSettingsService from '../services/emailSettings.service';
import * as emailSettingsDto from '../dtos/emailSettings.dto';
import asyncHandler from '../middleware/asyncHandler';

export const get = asyncHandler(async (req: Request, res: Response) => {
  const row = await emailSettingsService.get(req.params.employeeId);
  res.json(row || null);
});

export const save = asyncHandler(async (req: any, res: Response) => {
  const input = emailSettingsDto.toSaveInput(req.body);
  await emailSettingsService.save(req.params.employeeId, input, req.user?.id ?? null);
  res.json({ success: true });
});
