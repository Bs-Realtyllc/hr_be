import * as cultureEventRepo from '../repositories/cultureEvent.repository';
import type { CultureEventCreateInput } from '../dtos/cultureEvent.dto';

export async function upcoming() {
  return cultureEventRepo.findUpcoming();
}

export async function list() {
  return cultureEventRepo.findRecent();
}

export async function create(data: CultureEventCreateInput, actorId: number | null) {
  return cultureEventRepo.create(data, actorId);
}
