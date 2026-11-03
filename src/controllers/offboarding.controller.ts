import { Response } from "express";
import * as offboardingService from "../services/offboarding.service";
import * as offboardingDto from "../dtos/offboarding.dto";
import asyncHandler from "../middleware/asyncHandler";

export const initiate = asyncHandler(async (req: any, res: Response) => {
  const input = offboardingDto.toInitiateInput(req.body);
  const offboarding = await offboardingService.initiate(input, req.user?.id ?? null);
  res.status(201).json(offboarding);
});

export const list = asyncHandler(async (req: any, res: Response) => {
  const rows = await offboardingService.list(req.query.status as string | undefined);
  res.json(rows);
});

export const get = asyncHandler(async (req: any, res: Response) => {
  const offboarding = await offboardingService.get(Number(req.params.id));
  res.json(offboarding);
});

export const listByEmployee = asyncHandler(async (req: any, res: Response) => {
  const rows = await offboardingService.listByEmployee(Number(req.params.employeeId));
  res.json(rows);
});

export const updateTask = asyncHandler(async (req: any, res: Response) => {
  const input = offboardingDto.toTaskUpdateInput(req.body);
  const tasks = await offboardingService.updateTask(
    Number(req.params.id),
    Number(req.params.taskId),
    input.status,
    input.notes,
    req.user?.id ?? null,
  );
  res.json(tasks);
});

export const complete = asyncHandler(async (req: any, res: Response) => {
  const offboarding = await offboardingService.complete(Number(req.params.id), null, req.user?.id ?? null);
  res.json(offboarding);
});

export const cancel = asyncHandler(async (req: any, res: Response) => {
  const offboarding = await offboardingService.cancel(Number(req.params.id), req.user?.id ?? null);
  res.json(offboarding);
});
