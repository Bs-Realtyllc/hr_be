import * as serviceCredentialRepo from '../repositories/serviceCredential.repository';
import type { ServiceCredentialSaveInput } from '../dtos/serviceCredential.dto';

export async function get(employeeId: string) {
  return serviceCredentialRepo.findByEmployeeId(employeeId);
}

export async function save(employeeId: string, data: ServiceCredentialSaveInput, actorId: number | null) {
  await serviceCredentialRepo.upsert(employeeId, data, actorId);
}
