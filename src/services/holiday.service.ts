import * as holidayRepo from '../repositories/holiday.repository';
import type { HolidayCreateInput } from '../dtos/holiday.dto';

export async function list(year?: string) {
  return year ? holidayRepo.findByYear(year) : holidayRepo.findAll();
}

export async function create(data: HolidayCreateInput, actorId: number | null) {
  return holidayRepo.create(data, actorId);
}

export async function remove(id: string) {
  await holidayRepo.remove(id);
}
