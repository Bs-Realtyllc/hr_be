import * as weeklyReportRepo from '../repositories/weeklyReport.repository';
import AppError from '../pkg/AppError';

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, weekStartDate?: string, year?: string) {
  const privileged = ['admin', 'lead'].includes(user.role);
  const employeeId = privileged ? null : user.id;
  return weeklyReportRepo.findWithEmployeeNames({ employeeId, weekStartDate, year });
}

export async function submit(data: any) {
  return weeklyReportRepo.create(data);
}

export async function getForDownload(id: string, user: AuthUser) {
  const report: any = await weeklyReportRepo.findById(id);
  if (!report) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(user.role);
  if (!privileged && report.employee_id !== user.id) {
    throw new AppError('Access denied', 403);
  }
  return report;
}

export async function remove(id: string, user: AuthUser) {
  const report: any = await weeklyReportRepo.findById(id);
  if (!report) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(user.role);
  if (!privileged && report.employee_id !== user.id) {
    throw new AppError('You can only delete your own reports', 403);
  }

  const fs = require('fs');
  fs.unlink(report.file_path, () => {});
  await weeklyReportRepo.remove(id);
}
