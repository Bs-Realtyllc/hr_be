import * as employeeRepo from '../repositories/employee.repository';
import * as cultureEventRepo from '../repositories/cultureEvent.repository';

export async function upsertBirthdayEvent(employeeId: number, dob: string) {
  const d = new Date(dob);
  const year = new Date().getFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const date = `${year}-${mm}-${dd}`;

  const emp: any = await employeeRepo.findNameById(employeeId);
  const title = `${emp.name}'s Birthday`;

  const existing = await cultureEventRepo.findBirthdayByEmployeeId(employeeId);

  if (existing) {
    await cultureEventRepo.updateDateAndTitle(existing.id, date, title);
  } else {
    await cultureEventRepo.createBirthday(employeeId, date, title, `Happy Birthday ${emp.name}! 🎉`);
  }
}
