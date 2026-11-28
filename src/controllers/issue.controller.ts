import { Request, Response } from 'express';
import * as issueService from '../services/issue.service';
import * as issueDto from '../dtos/issue.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rows = await issueService.list(req.params.id);
  res.json(issueDto.toResponseList(rows));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = issueDto.toCreateInput(req.body);
  const id = await issueService.create(req.params.id, input, req.user);
  res.status(201).json({ id });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = issueDto.toUpdateInput(req.body);
  await issueService.update(req.params.iid, input, req.user);
  res.json({ success: true });
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await issueService.remove(req.params.iid, req.user);
  res.json({ success: true });
});

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const rows = await issueService.listComments(req.params.iid);
  res.json(rows);
});

export const addComment = asyncHandler(async (req: any, res: Response) => {
  const input = issueDto.toCommentInput(req.body);
  const id = await issueService.addComment(req.params.iid, input.body, req.user, input.mentioned_employee_ids);
  res.status(201).json({ id });
});

export const listActivity = asyncHandler(async (req: Request, res: Response) => {
  const rows = await issueService.listActivity(req.params.iid);
  res.json(rows);
});

export const listLabels = asyncHandler(async (req: Request, res: Response) => {
  const rows = await issueService.listLabels(req.params.id);
  res.json(rows);
});

export const createLabel = asyncHandler(async (req: any, res: Response) => {
  const input = issueDto.toLabelInput(req.body);
  const id = await issueService.createLabel(req.params.id, input.name, input.color ?? '#6b7280', req.user);
  res.status(201).json({ id });
});

export const removeLabel = asyncHandler(async (req: any, res: Response) => {
  await issueService.removeLabel(req.params.id, req.params.lid, req.user);
  res.json({ success: true });
});

export const listLinks = asyncHandler(async (req: Request, res: Response) => {
  const rows = await issueService.listLinks(req.params.iid);
  res.json(rows);
});

export const addLink = asyncHandler(async (req: any, res: Response) => {
  const input = issueDto.toLinkInput(req.body);
  const id = await issueService.addLink(req.params.iid, input.linked_issue_id, input.link_type, req.user);
  res.status(201).json({ id });
});

export const removeLink = asyncHandler(async (req: any, res: Response) => {
  await issueService.removeLink(req.params.iid, req.params.lid, req.user);
  res.json({ success: true });
});

export const listAttachments = asyncHandler(async (req: Request, res: Response) => {
  const rows = await issueService.listAttachments(req.params.iid);
  res.json(rows);
});

export const addAttachment = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) throw new AppError('A file is required', 400);
  const id = await issueService.addAttachment(req.params.iid, req.file, req.user);
  res.status(201).json({ id });
});

export const removeAttachment = asyncHandler(async (req: any, res: Response) => {
  await issueService.removeAttachment(req.params.iid, req.params.aid, req.user);
  res.json({ success: true });
});

export const downloadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { stream, size, contentType, fileName } = await issueService.getAttachmentForDownload(
    req.params.iid,
    req.params.aid,
  );
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', String(size));
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  (stream as any).pipe(res);
});
