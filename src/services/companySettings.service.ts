import * as companySettingsRepo from '../repositories/companySettings.repository';
import type { CompanySettingsSaveInput } from '../dtos/companySettings.dto';

export async function get() {
  return companySettingsRepo.find();
}

export async function save(data: CompanySettingsSaveInput, actorId: number | null) {
  await companySettingsRepo.upsert(data, actorId);
}
