import { Request, Response } from 'express';
import * as ackService from '../services/documentAcknowledgement.service';
import * as documentDto from '../dtos/document.dto';
import asyncHandler from '../middleware/asyncHandler';

// POST /documents/:id/acknowledgements
// Employee submits (or re-submits) an acknowledgement for document :id
export const submit = asyncHandler(async (req: any, res: Response) => {
  const { documentId, signedFilePath } = documentDto.toSubmitInput(
    req.params.id,
    req.file?.filename ?? null,
  );
  await ackService.submitAcknowledgement(documentId, req.user.id, signedFilePath);
  res.status(201).json({ success: true });
});

// GET /documents/acknowledgements/mine
// Employee fetches their own acknowledgement records across all documents
export const myAcknowledgements = asyncHandler(async (req: any, res: Response) => {
  const list = await ackService.myAcknowledgements(req.user.id);
  res.json(list);
});

// GET /documents/:id/acknowledgements
// Admin fetches all acknowledgement submissions for a specific document
export const listForDocument = asyncHandler(async (req: Request, res: Response) => {
  const list = await ackService.listForDocument(req.params.id);
  res.json(list);
});

// GET /documents/acknowledgements
// Admin fetches all acknowledgements across every document
export const listAll = asyncHandler(async (_req: Request, res: Response) => {
  const list = await ackService.listAll();
  res.json(list);
});

// PATCH /documents/acknowledgements/:ackId/review
// Admin approves or rejects a submitted acknowledgement
export const review = asyncHandler(async (req: any, res: Response) => {
  const { status, rejectionReason } = documentDto.toReviewInput(req.body);
  await ackService.reviewAcknowledgement(req.params.ackId, status, rejectionReason, req.user.id);
  res.json({ success: true });
});
