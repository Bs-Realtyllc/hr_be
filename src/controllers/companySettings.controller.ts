import { Request, Response } from 'express';
import * as companySettingsService from '../services/companySettings.service';
import * as companySettingsDto from '../dtos/companySettings.dto';
import * as employeeService from '../services/employee.service';
import asyncHandler from '../middleware/asyncHandler';

export const get = asyncHandler(async (req: Request, res: Response) => {
  const row = await companySettingsService.get();
  res.json(row || { name: null, email: null, website: null, updated_at: null });
});

export const save = asyncHandler(async (req: any, res: Response) => {
  const input = companySettingsDto.toSaveInput(req.body);
  await companySettingsService.save(input, req.user?.id ?? null);
  res.json({ success: true });
});

export const teamAccess = asyncHandler(async (req: Request, res: Response) => {
  const rows = await employeeService.listTeamAccess();
  res.json(rows);
});
