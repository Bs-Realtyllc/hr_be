import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as authDto from '../dtos/auth.dto';
import asyncHandler from '../middleware/asyncHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = authDto.toLoginInput(req.body);
  const result = await authService.login(input, { ip: req.ip, userAgent: req.headers['user-agent'] });
  res.json(result);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const input = authDto.toVerifyOtpInput(req.body);
  const result = await authService.verifyOtp({ ...input, ip: req.ip || 'unknown' });
  res.json(result);
});


export const changePassword = asyncHandler(async (req: any, res: Response) => {
  const input = authDto.toChangePasswordInput(req.body);
  await authService.changePassword(req.user.id, input);
  res.json({ message: 'Password updated' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = authDto.toForgotPasswordInput(req.body);
  await authService.forgotPassword(input);
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = authDto.toResetPasswordInput(req.body);
  await authService.resetPassword(input);
  res.json({ message: 'Password reset successfully. You can now log in.' });
});

export const getLoginHistory = asyncHandler(async (req: any, res: Response) => {
  const result = await authService.getLoginHistory(req.user.id, req.query);
  res.json(result);
});

export const adminGetAllLoginHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.adminGetAllLoginHistory(req.query);
  res.json(result);
});

export const adminGetEmployeeLoginHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.adminGetEmployeeLoginHistory(Number(req.params.employeeId), req.query);
  res.json(result);
});
