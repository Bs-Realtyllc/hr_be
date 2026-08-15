import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import * as policyService from '../services/policy.service';
import * as policyDto from '../dtos/policy.dto';
import asyncHandler from '../middleware/asyncHandler';

export const listPolicies = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;
  const policies = await policyService.listPolicies(category as string | undefined);
  res.json(policies);
});

export const uploadPolicy = asyncHandler(async (req: any, res: Response) => {
  const input = policyDto.toUploadInput(req.body, !!req.file);

  try {
    const { id, version } = await policyService.uploadPolicy(input, req.file.filename, req.user.id);
    res.json({ id, version, filename: req.file.filename });
  } catch (err) {
    deleteUpload(req.file.filename);
    throw err;
  }
});

export const deletePolicy = asyncHandler(async (req: Request, res: Response) => {
  const policy: any = await policyService.removePolicy(req.params.id);
  deleteUpload(policy.file_path);
  res.json({ success: true });
});

export const setPinned = asyncHandler(async (req: Request, res: Response) => {
  const { pinned } = req.body;
  await policyService.setPinned(req.params.id, !!pinned);
  res.json({ success: true });
});

function deleteUpload(filename: string) {
  const full = path.join(process.cwd(), 'uploads/policies', filename);
  fs.unlink(full, () => {});
}
