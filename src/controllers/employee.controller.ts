import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import * as employeeDto from '../dtos/employee.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const list = asyncHandler(async (req: any, res: Response) => {
  const role = req.user?.role;
  const isPrivileged = ['admin', 'lead'].includes(role);
  if (!isPrivileged) {
    // Row-level scoping: non-admins only receive their own employee record
    const empId = req.user?.employeeId ?? req.user?.id;
    if (!empId) {
      return res.json([]);
    }
    const singleEmp = await employeeService.get(String(empId));
    return res.json(singleEmp ? employeeDto.toResponseList([singleEmp]) : []);
  }
  const employees = await employeeService.list();
  res.json(employeeDto.toResponseList(employees));
});

export const listOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const employees = await employeeService.listOnboarding();
  res.json(employeeDto.toResponseList(employees));
});

export const get = asyncHandler(async (req: any, res: Response) => {
  const role = req.user?.role;
  const isPrivileged = ['admin', 'lead'].includes(role);
  let targetId = req.params.id;

  if (!isPrivileged) {
    // Row-level scoping: force query to use requester's own employeeId
    targetId = String(req.user?.employeeId ?? req.user?.id);
  }

  const employee = await employeeService.get(targetId);
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

export const payrollSummary = asyncHandler(async (req: any, res: Response) => {
  const role = req.user?.role;
  const isPrivileged = ['admin', 'lead'].includes(role);
  let targetId = req.params.id;

  if (!isPrivileged) {
    targetId = String(req.user?.employeeId ?? req.user?.id);
  }

  const summary = await employeeService.payrollSummary(targetId);
  res.json(summary);
});

export const getTaxProfile = asyncHandler(async (req: any, res: Response) => {
  const role = req.user?.role;
  const isPrivileged = ['admin', 'lead'].includes(role);
  let targetId = req.params.id;

  if (!isPrivileged) {
    // Row-level scoping: force requester's own employeeId
    targetId = String(req.user?.employeeId ?? req.user?.id);
  }

  const taxProfile = await employeeService.getTaxProfile(targetId, req.user?.id, req.user?.role);
  if (!taxProfile) throw new AppError('Tax profile not found', 404);
  res.json(taxProfile);
});

export const getCompensationHistory = asyncHandler(async (req: any, res: Response) => {
  const role = req.user?.role;
  const isPrivileged = ['admin', 'lead'].includes(role);
  let targetId = req.params.id;

  if (!isPrivileged) {
    // Row-level scoping: force requester's own employeeId
    targetId = String(req.user?.employeeId ?? req.user?.id);
  }

  const history = await employeeService.getCompensationHistory(targetId, req.user?.id, req.user?.role);
  res.json(history);
});

