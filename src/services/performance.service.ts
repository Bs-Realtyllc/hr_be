import * as performanceRepo from '../repositories/performanceReview.repository';
import AppError from '../pkg/AppError';
import type { PerformanceCreateInput, PerformanceUpdateInput } from '../dtos/performance.dto';

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, employeeIdFilter?: string, status?: string) {
  const privileged = ['admin', 'lead'].includes(user.role);
  // console.log(user, employeeIdFilter, status)
  const filterEmployeeId = privileged ? employeeIdFilter : user.id;
  return performanceRepo.findWithNames({ employeeId: filterEmployeeId, status });
}

export async function trend(employeeId: string, user: AuthUser) {
  const privileged = ['admin', 'lead'].includes(user.role);
  if (!privileged && Number(employeeId) !== user.id) {
    throw new AppError('Insufficient permissions', 403);
  }
  return performanceRepo.ratingTrendByEmployee(employeeId);
}

export async function create(data: PerformanceCreateInput, user: AuthUser) {
  if (!['admin', 'lead'].includes(user.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  try {
    return await performanceRepo.create(data);
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('A review for this period already exists for this employee', 400);
    }
    throw err;
  }
}

export async function update(id: string, data: PerformanceUpdateInput, user: AuthUser) {
  if (!['admin', 'lead'].includes(user.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  const review: any = await performanceRepo.findById(id);
  if (!review) throw new AppError('Not found', 404);
  if (review.status !== 'draft') {
    throw new AppError('Only draft reviews can be edited', 400);
  }
  await performanceRepo.update(id, data, user.id);
}

export async function submit(id: string, user: AuthUser) {
  if (!['admin', 'lead'].includes(user.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  const review: any = await performanceRepo.findById(id);
  if (!review) throw new AppError('Not found', 404);
  if (review.status !== 'draft') {
    throw new AppError('Review has already been submitted', 400);
  }
  await performanceRepo.submit(id, user.id);
}

export async function acknowledge(id: string, employeeComments: string | null, user: AuthUser) {
  const review: any = await performanceRepo.findById(id);
  if (!review) throw new AppError('Not found', 404);
  if (review.employee_id !== user.id) {
    throw new AppError('Only the reviewed employee can acknowledge this review', 403);
  }
  if (review.status !== 'submitted') {
    throw new AppError('Only submitted reviews can be acknowledged', 400);
  }
  await performanceRepo.acknowledge(id, employeeComments, user.id);
}

export async function remove(id: string, user: AuthUser) {
  if (!['admin', 'lead'].includes(user.role)) {
    throw new AppError('Insufficient permissions', 403);
  }
  const review: any = await performanceRepo.findById(id);
  if (!review) throw new AppError('Not found', 404);
  if (review.status !== 'draft') {
    throw new AppError('Only draft reviews can be deleted', 400);
  }
  await performanceRepo.remove(id);
}
