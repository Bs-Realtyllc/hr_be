import * as serverRepo from '../repositories/server.repository';
import AppError from '../pkg/AppError';
import type { ServerCreateInput, ServerUpdateInput } from '../dtos/server.dto';

export async function list(projectId?: string) {
  return serverRepo.findAll(projectId);
}

export async function create(data: ServerCreateInput, actorId: number | null) {
  return serverRepo.create(data, actorId);
}

export async function update(id: string, updates: ServerUpdateInput, actorId: number | null) {
  if (!Object.keys(updates).length) throw new AppError('Nothing to update', 400);
  await serverRepo.update(id, updates, actorId);
}

export async function remove(id: string) {
  await serverRepo.remove(id);
}
