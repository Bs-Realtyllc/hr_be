import * as feedbackRepo from '../repositories/feedback.repository';
import AppError from '../pkg/AppError';
import type { FeedbackCreateInput } from '../dtos/feedback.dto';

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, scope: string, employeeIdFilter: string | undefined, type: string | undefined) {
  const privileged = ['admin', 'lead'].includes(user.role);
  let employeeId = employeeIdFilter;
  if (scope === 'received' || scope === 'sent') {
    employeeId = privileged && employeeId ? employeeId : String(user.id);
  }
  return feedbackRepo.findFeed({ scope, employeeId, type });
}

export async function summary() {
  return feedbackRepo.summaryReceivedByEmployee();
}

export async function create(data: FeedbackCreateInput) {
  return feedbackRepo.create(data);
}

export async function remove(id: string, user: AuthUser) {
  const note: any = await feedbackRepo.findById(id);
  if (!note) throw new AppError('Not found', 404);

  const privileged = ['admin', 'lead'].includes(user.role);
  if (!privileged && note.from_employee_id !== user.id) {
    throw new AppError('You can only delete your own feedback notes', 403);
  }
  await feedbackRepo.remove(id);
}
