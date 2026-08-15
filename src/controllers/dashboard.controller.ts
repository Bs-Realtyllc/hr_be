import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import asyncHandler from '../middleware/asyncHandler';

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await dashboardService.getStats();
  res.json(stats);
});

export const standupTrend = asyncHandler(async (req: Request, res: Response) => {
  const rows = await dashboardService.standupTrend();
  res.json(rows);
});

export const leaveTrend = asyncHandler(async (req: Request, res: Response) => {
  const rows = await dashboardService.leaveTrend();
  res.json(rows);
});
