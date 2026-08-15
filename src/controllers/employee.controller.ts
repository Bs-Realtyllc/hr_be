import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import * as employeeDto from '../dtos/employee.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

// Bind request -> DTO happens here, at the boundary — never inside the
// service. Services take already-validated, typed DTO input; controllers
// never touch a model/repository directly. Response mapping (service result
// -> output DTO) also happens here, right before res.json.

export const list = asyncHandler(async (req: Request, res: Response) => {
  const employees = await employeeService.list();
  res.json(employeeDto.toResponseList(employees));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.get(req.params.id);
  if (!employee) throw new AppError('Not found', 404);
  res.json(employeeDto.toResponse(employee));
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const input = employeeDto.toCreateInput(req.body);
  const id = await employeeService.create(input, req.user?.id ?? null);
  res.status(201).json({ id });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const input = employeeDto.toUpdateInput(req.body);
  await employeeService.update(req.params.id, input, req.user?.id ?? null);
  res.json({ success: true });
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await employeeService.remove(req.params.id, req.user?.id ?? null);
  res.json({ success: true });
});

export const payrollSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await employeeService.payrollSummary(req.params.id);
  res.json(summary);
});
