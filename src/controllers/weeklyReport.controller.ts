import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import * as weeklyReportService from '../services/weeklyReport.service';
import * as weeklyReportDto from '../dtos/weeklyReport.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const list = asyncHandler(async (req: any, res: Response) => {
  const { week_start_date, year } = req.query;
  const rows = await weeklyReportService.list(req.user, week_start_date, year);
  res.json(rows);
});

export const submit = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  let data;
  try {
    data = weeklyReportDto.toCreateInput(req.body, req.file);
  } catch (err: any) {
    fs.unlink(req.file.path, () => {});
    throw new AppError(err.message, err.status || 400);
  }

  // Rename the file to `<EmployeeName>_<timestamp>.<ext>` within its week folder.
  const safeName = (req.user?.name || 'employee').trim().replace(/[^a-zA-Z0-9]+/g, '_');
  const ext = path.extname(req.file.originalname).toLowerCase();
  const finalFileName = `${safeName}_${Date.now()}${ext}`;
  const finalPath = path.join(path.dirname(req.file.path), finalFileName);

  try {
    fs.renameSync(req.file.path, finalPath);
    data.file_name = finalFileName;
    data.file_path = finalPath;
  } catch (err: any) {
    fs.unlink(req.file.path, () => {});
    throw new AppError(`Failed to store file: ${err.message}`, 500);
  }

  try {
    const id = await weeklyReportService.submit(data);
    res.status(201).json({ id });
  } catch (err) {
    fs.unlink(finalPath, () => {});
    throw err;
  }
});

export const download = asyncHandler(async (req: any, res: Response) => {
  const report: any = await weeklyReportService.getForDownload(req.params.id, req.user);
  res.download(path.resolve(report.file_path), report.file_name);
});

export const remove = asyncHandler(async (req: any, res: Response) => {
  await weeklyReportService.remove(req.params.id, req.user);
  res.json({ success: true });
});
