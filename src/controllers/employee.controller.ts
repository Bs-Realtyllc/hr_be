import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import * as employeeDto from '../dtos/employee.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const employees = await employeeService.list();
  res.json(employeeDto.toResponseList(employees));
});

export const listOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const employees = await employeeService.listOnboarding();
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

export const approve = asyncHandler(async (req: any, res: Response) => {
  await employeeService.approve(req.params.id, req.user?.id ?? null);
  res.json({ success: true });
});

export const reject = asyncHandler(async (req: any, res: Response) => {
  const notify = req.query.send_mail === 'true';
  await employeeService.reject(req.params.id, notify);
  res.json({ success: true });
});

export const payrollSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await employeeService.payrollSummary(req.params.id);
  res.json(summary);
});

export const getAllNames = asyncHandler(async(req:any, res:Response) =>{
  const result = await employeeService.listAllNames();
  res.status(200).json(result);
})
