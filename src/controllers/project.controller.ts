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

export const addAssignment = asyncHandler(async (req: any, res: Response) => {
  const input = projectDto.toAssignmentInput(req.body);
  await projectService.addAssignment(req.params.id, input, req.user);
  res.status(201).json({ success: true });
});

export const removeAssignment = asyncHandler(async (req: any, res: Response) => {
  await projectService.removeAssignment(req.params.id, req.params.empId, req.user);
  res.json({ success: true });
});

export const getModules = asyncHandler(async (req: Request, res: Response) => {
  const rows = await projectService.getModules(req.params.id);
  res.json(rows);
});

export const createModule = asyncHandler(async (req: any, res: Response) => {
  const input = projectDto.toModuleCreateInput(req.body);
  const id = await projectService.createModule(req.params.id, input, req.user);
  res.status(201).json({ id });
});

export const updateModule = asyncHandler(async (req: any, res: Response) => {
  const input = projectDto.toModuleUpdateInput(req.body);
  await projectService.updateModule(req.params.id, req.params.mid, input, req.user);
  res.json({ success: true });
});

export const getModuleMembers = asyncHandler(async (req: Request, res: Response) => {
  const rows = await projectService.getModuleMembers(req.params.id, req.params.mid);
  res.json(rows);
});

export const addModuleMember = asyncHandler(async (req: any, res: Response) => {
  const input = projectDto.toModuleMemberInput(req.body);
  await projectService.addModuleMember(req.params.id, req.params.mid, input, req.user);
  res.status(201).json({ success: true });
});

export const removeModuleMember = asyncHandler(async (req: any, res: Response) => {
  await projectService.removeModuleMember(req.params.id, req.params.mid, req.params.empId, req.user);
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

export const byEmployee = asyncHandler(async (req: Request, res: Response) => {
  const rows = await projectService.byEmployee(req.params.empId);
  res.json(projectDto.toResponseList(rows));
});
