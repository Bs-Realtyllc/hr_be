import { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import * as projectDto from '../dtos/project.dto';
import asyncHandler from '../middleware/asyncHandler';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rows = await projectService.list(req.query.status as string | undefined);
  res.json(projectDto.toResponseList(rows));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = projectDto.toCreateInput(req.body);
  const id = await projectService.create(input, req.user?.id ?? null);
  res.status(201).json({ id });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = projectDto.toUpdateInput(req.body);
  await projectService.update(req.params.id, input, req.user?.id ?? null);
  res.json({ success: true });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await projectService.remove(req.params.id);
  res.json({ success: true });
});

export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const rows = await projectService.getAssignments(req.params.id);
  res.json(rows);
});

export const addAssignment = asyncHandler(async (req: Request, res: Response) => {
  const input = projectDto.toAssignmentInput(req.body);
  await projectService.addAssignment(req.params.id, input);
  res.status(201).json({ success: true });
});

export const removeAssignment = asyncHandler(async (req: Request, res: Response) => {
  await projectService.removeAssignment(req.params.id, req.params.empId);
  res.json({ success: true });
});

export const getMilestones = asyncHandler(async (req: Request, res: Response) => {
  const rows = await projectService.getMilestones(req.params.id);
  res.json(rows);
});

export const addMilestone = asyncHandler(async (req: Request, res: Response) => {
  const input = projectDto.toMilestoneCreateInput(req.body);
  const id = await projectService.addMilestone(req.params.id, input);
  res.status(201).json({ id });
});

export const updateMilestone = asyncHandler(async (req: Request, res: Response) => {
  const input = projectDto.toMilestoneUpdateInput(req.body);
  await projectService.updateMilestone(req.params.id, req.params.mid, input);
  res.json({ success: true });
});

export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const keys = await projectService.getServices(req.params.id);
  res.json(keys);
});

export const addService = asyncHandler(async (req: Request, res: Response) => {
  const input = projectDto.toServiceInput(req.body);
  await projectService.addService(req.params.id, input.service_key);
  res.status(201).json({ success: true });
});

export const removeService = asyncHandler(async (req: Request, res: Response) => {
  await projectService.removeService(req.params.id, req.params.serviceKey);
  res.json({ success: true });
});

// Returns all projects an employee is assigned to, with their role + milestones
export const byEmployee = asyncHandler(async (req: Request, res: Response) => {
  const rows = await projectService.byEmployee(req.params.empId);
  res.json(projectDto.toResponseList(rows));
});
