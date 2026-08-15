import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import asyncHandler from '../middleware/asyncHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const changePassword = asyncHandler(async (req: any, res: Response) => {
  await authService.changePassword(req.user.id, req.body);
  res.json({ message: 'Password updated' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body);
  // Always respond the same way to prevent email enumeration.
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);
  res.json({ message: 'Password reset successfully. You can now log in.' });
});
