import { Request, Response } from 'express';
import * as leaveService from '../services/leave.service';
import * as leaveDto from '../dtos/leave.dto';
import asyncHandler from '../middleware/asyncHandler';

// Bind request -> DTO happens here, at the boundary — never inside the
// service (see employee.controller.ts for the same rule).

export const list = asyncHandler(async (req: any, res: Response) => {
  const { employee_id, status } = req.query;
  const rows = await leaveService.list(req.user, employee_id, status);
  res.json(leaveDto.toResponseList(rows));
});

export const balances = asyncHandler(async (req: Request, res: Response) => {
  const rows = await leaveService.balances(req.params.employeeId);
  res.json(rows);
});

export const report = asyncHandler(async (req: Request, res: Response) => {
  const result = await leaveService.report();
  res.json(result);
});

export const outToday = asyncHandler(async (req: Request, res: Response) => {
  const rows = await leaveService.outToday();
  res.json(rows);
});

export const outThisWeek = asyncHandler(async (req: Request, res: Response) => {
  const rows = await leaveService.outThisWeek();
  res.json(rows);
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const { to, cc, bcc } = req.body; // not part of the leave record itself — notification-only
  const input = leaveDto.toCreateInput(req.body);
  const id = await leaveService.create(input, req.user?.id ?? null, { to, cc, bcc });
  res.status(201).json({ id });
});

export const approve = asyncHandler(async (req: any, res: Response) => {
  await leaveService.approve(req.params.id, req.user);
  res.json({ success: true });
});

export const reject = asyncHandler(async (req: any, res: Response) => {
  await leaveService.reject(req.params.id, req.user);
  res.json({ success: true });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = leaveDto.toUpdateInput(req.body);
  await leaveService.update(req.params.id, input, req.user.id);
  res.json({ success: true });
});

export const cancel = asyncHandler(async (req: any, res: Response) => {
  await leaveService.cancel(req.params.id, req.user.id);
  res.json({ success: true });
});
