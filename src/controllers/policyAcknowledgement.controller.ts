import { Request, Response } from 'express';
import * as policyAckService from '../services/policyAcknowledgement.service';
import * as policyDto from '../dtos/policy.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const submitAcknowledgement = asyncHandler(async (req: any, res: Response) => {
  const policyId = req.params.id;
  if (!req.file) throw new AppError('No file uploaded', 400);

  await policyAckService.submitAcknowledgement(policyId, req.user.id, req.file.filename);
  res.json({ success: true });
});

export const myAcknowledgements = asyncHandler(async (req: any, res: Response) => {
  const rows = await policyAckService.myAcknowledgements(req.user.id);
  res.json(rows);
});

export const listForEmployeeAdmin = asyncHandler(async (req: Request, res: Response) => {
  const rows = await policyAckService.listForEmployeeAdmin(req.params.id);
  res.json(rows);
});

export const listSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const rows = await policyAckService.listSubmissions(req.params.id);
  res.json(rows);
});

export const reviewSubmission = asyncHandler(async (req: any, res: Response) => {
  const input = policyDto.toReviewInput(req.body);
  await policyAckService.reviewSubmission(req.params.ackId, input.status, input.rejection_reason, req.user.id);
  res.json({ success: true });
});
