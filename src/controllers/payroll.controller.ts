import { Response } from 'express';
import * as payrollService from '../services/payroll.service';
import * as payrollDto from '../dtos/payroll.dto';
import asyncHandler from '../middleware/asyncHandler';

export const getPayroll = asyncHandler(async (req: any, res: Response) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const rows = await payrollService.getPayroll(privileged, req.user.id);
  res.json(rows);
});

export const updateSalary = asyncHandler(async (req: any, res: Response) => {
  const input = payrollDto.toUpdateSalaryInput(req.body);
  await payrollService.updateSalary(req.params.id, input.salary, input.pay_frequency, req.user?.id ?? null);
  res.json({ message: 'Salary updated' });
});

export const resetPassword = asyncHandler(async (req: any, res: Response) => {
  const password = payrollDto.validatePasswordReset(req.body.password);
  await payrollService.resetPassword(req.params.id, password);
  res.json({ message: 'Password reset successfully' });
});

export const getTaxes = asyncHandler(async (req: any, res: Response) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const rows = await payrollService.getTaxes(privileged, req.user.id, month, year);
  res.json(rows);
});

export const updateTaxProfile = asyncHandler(async (req: any, res: Response) => {
  const input = payrollDto.toTaxProfileInput(req.body);
  await payrollService.updateTaxProfile(req.params.id, input);
  res.json({ message: 'Tax profile updated' });
});

export const getAdjustments = asyncHandler(async (req: any, res: Response) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const { employee_id, year, month } = req.query;
  const rows = await payrollService.getAdjustments(privileged, req.user.id, employee_id, year, month);
  res.json(rows);
});

export const getSummary = asyncHandler(async (req: any, res: Response) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const summary = await payrollService.buildSummary(privileged, req.user.id);
  res.json(summary);
});

export const runYearEndBonus = asyncHandler(async (req: any, res: Response) => {
  const year = Number(req.body.year) || new Date().getFullYear();
  const result = await payrollService.runYearEndBonus(year);
  res.json(result);
});

export const getFinancialReport = asyncHandler(async (req: any, res: Response) => {
  const privileged = ['admin', 'lead'].includes(req.user?.role);
  const filterEmployeeId = privileged ? req.query.employee_id || null : req.user.id;
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;

  const report = await payrollService.buildFinancialReport(filterEmployeeId, year, month);
  res.json({ year, month, report });
});
