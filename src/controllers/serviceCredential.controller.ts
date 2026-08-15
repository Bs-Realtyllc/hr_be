import { Request, Response } from 'express';
import * as serviceCredentialService from '../services/serviceCredential.service';
import * as serviceCredentialDto from '../dtos/serviceCredential.dto';
import asyncHandler from '../middleware/asyncHandler';

export const get = asyncHandler(async (req: Request, res: Response) => {
  // Never return passwords to the client
  const rows = await serviceCredentialService.get(req.params.employeeId);
  res.json(rows);
});

export const save = asyncHandler(async (req: any, res: Response) => {
  const input = serviceCredentialDto.toSaveInput(req.body);
  await serviceCredentialService.save(req.params.employeeId, input, req.user?.id ?? null);
  res.json({ success: true });
});
