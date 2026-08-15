import * as projectRepo from '../repositories/project.repository';
import AppError from '../pkg/AppError';
import type {
  ProjectCreateInput,
  ProjectUpdateInput,
  AssignmentInput,
  MilestoneCreateInput,
  MilestoneUpdateInput,
} from '../dtos/project.dto';

export async function list(status?: string) {
  return projectRepo.findAll(status);
}

export async function create(data: ProjectCreateInput, actorId: number | null) {
  return projectRepo.create(data, actorId);
}

export async function update(id: string, updates: ProjectUpdateInput, actorId: number | null) {
  if (!Object.keys(updates).length) throw new AppError('Nothing to update', 400);
  await projectRepo.update(id, updates, actorId);
}

export async function remove(id: string) {
  await projectRepo.remove(id);
}

export async function getAssignments(id: string) {
  return projectRepo.findAssignments(id);
}

export async function addAssignment(id: string, input: AssignmentInput) {
  await projectRepo.addAssignment(id, input.employee_id, input.role);
}

export async function removeAssignment(id: string, empId: string) {
  await projectRepo.removeAssignment(id, empId);
}

export async function getMilestones(id: string) {
  return projectRepo.findMilestones(id);
}

export async function addMilestone(id: string, input: MilestoneCreateInput) {
  return projectRepo.addMilestone(id, input.title, input.due_date, input.status || 'pending');
}

export async function updateMilestone(id: string, milestoneId: string, input: MilestoneUpdateInput) {
  await projectRepo.updateMilestone(id, milestoneId, input.title ?? undefined, input.due_date ?? undefined, input.status ?? undefined);
}

export async function getServices(id: string) {
  const rows = await projectRepo.findServices(id);
  return rows.map((r) => r.service_key);
}

export async function addService(id: string, serviceKey: string) {
  await projectRepo.addService(id, serviceKey);
}

export async function removeService(id: string, serviceKey: string) {
  await projectRepo.removeService(id, serviceKey);
}

export async function byEmployee(empId: string) {
  const rows = await projectRepo.findByEmployee(empId);

  const withMilestones = [];
  for (const row of rows) {
    const projectMilestones = await projectRepo.findMilestonesForProject(row.id);
    withMilestones.push({ ...row, milestones: projectMilestones });
  }
  return withMilestones;
}
