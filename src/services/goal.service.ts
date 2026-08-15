import * as goalRepo from '../repositories/goal.repository';
import AppError from '../pkg/AppError';
import type { GoalCreateInput, GoalUpdateInput, GoalProgressInput } from '../dtos/goal.dto';

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, employeeIdFilter?: string, status?: string, category?: string) {
  const privileged = ['admin', 'lead'].includes(user.role);
  const filterEmployeeId = privileged ? employeeIdFilter : user.id;
  return goalRepo.findWithNames({ employeeId: filterEmployeeId, status, category });
}

export async function summary() {
  return goalRepo.summaryByEmployee();
}

export async function create(data: GoalCreateInput) {
  return goalRepo.create(data);
}

async function authorizeOwnGoal(id: string, user: AuthUser) {
  const goal: any = await goalRepo.findById(id);
  if (!goal) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(user.role);
  if (!privileged && goal.employee_id !== user.id) {
    throw new AppError('Insufficient permissions', 403);
  }
  return goal;
}

export async function update(id: string, updates: GoalUpdateInput, user: AuthUser) {
  await authorizeOwnGoal(id, user);
  await goalRepo.update(id, updates, user.id);
}

export async function updateProgress(id: string, updates: GoalProgressInput, user: AuthUser) {
  await authorizeOwnGoal(id, user);
  await goalRepo.updateProgress(id, updates, user.id);
}

export async function remove(id: string, user: AuthUser) {
  await authorizeOwnGoal(id, user);
  await goalRepo.remove(id);
}
