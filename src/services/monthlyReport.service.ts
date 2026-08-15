import * as monthlyReportRepo from '../repositories/monthlyReport.repository';
import AppError from '../pkg/AppError';

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, filters: Record<string, any>) {
  const privileged = ['admin', 'lead'].includes(user.role);
  const employeeId = privileged ? null : user.id;
  return monthlyReportRepo.findWithEmployeeNames({ employeeId, ...filters });
}

export async function submit(data: any) {
  return monthlyReportRepo.create(data);
}

export async function getForDownload(id: string, user: AuthUser) {
  const report: any = await monthlyReportRepo.findById(id);
  if (!report) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(user.role);
  if (!privileged && report.employee_id !== user.id) {
    throw new AppError('Access denied', 403);
  }
  return report;
}

export async function remove(id: string, user: AuthUser) {
  const report: any = await monthlyReportRepo.findById(id);
  if (!report) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(user.role);
  if (!privileged && report.employee_id !== user.id) {
    throw new AppError('You can only delete your own reports', 403);
  }

  const fs = require('fs');
  fs.unlink(report.file_path, () => {});
  await monthlyReportRepo.remove(id);
}
