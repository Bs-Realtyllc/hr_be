import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import * as monthlyReportService from '../services/monthlyReport.service';
import * as monthlyReportDto from '../dtos/monthlyReport.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const list = asyncHandler(async (req: any, res: Response) => {
  const { month, year, fromYear, fromMonth, toYear, toMonth } = req.query;
  const rows = await monthlyReportService.list(req.user, { month, year, fromYear, fromMonth, toYear, toMonth });
  res.json(rows);
});

export const submit = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  let data;
  try {
    data = monthlyReportDto.toCreateInput(req.body, req.file);
  } catch (err: any) {
    fs.unlink(req.file.path, () => {});
    throw new AppError(err.message, err.status || 400);
  }

  try {
    const id = await monthlyReportService.submit(data);
    res.status(201).json({ id });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    throw err;
  }
});

export const download = asyncHandler(async (req: any, res: Response) => {
  const report: any = await monthlyReportService.getForDownload(req.params.id, req.user);
  res.download(path.resolve(report.file_path), report.file_name);
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await monthlyReportService.remove(req.params.id, req.user);
  res.json({ success: true });
});
