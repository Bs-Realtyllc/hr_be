import * as cultureEventRepo from '../repositories/cultureEvent.repository';
import type { CultureEventCreateInput } from '../dtos/cultureEvent.dto';

// Business logic only — no req/res, no raw request bodies. Every input here
// is already bound+validated by cultureEvent.controller.ts via cultureEvent.dto.ts.

export async function upcoming() {
  return cultureEventRepo.findUpcoming();
}

export async function list() {
  return cultureEventRepo.findRecent();
}

export async function create(data: CultureEventCreateInput, actorId: number | null) {
  return cultureEventRepo.create(data, actorId);
}
