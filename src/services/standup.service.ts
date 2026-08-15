import * as standupRepo from '../repositories/standup.repository';
import * as employeeRepo from '../repositories/employee.repository';
import type { StandupCreateInput } from '../dtos/standup.dto';

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, employeeIdFilter?: string, date?: string, startDate?: string, endDate?: string) {
  const privileged = ['admin', 'lead'].includes(user.role);
  const filterEmployeeId = privileged ? employeeIdFilter : user.id;
  return standupRepo.findWithNames({ employeeId: filterEmployeeId, date, startDate, endDate });
}

export async function today(user: AuthUser) {
  const todayDate = new Date().toISOString().split('T')[0];
  const privileged = ['admin', 'lead'].includes(user.role);
  const filterEmployeeId = privileged ? undefined : user.id;
  return standupRepo.findToday(todayDate, filterEmployeeId);
}

export async function create(data: StandupCreateInput, actorId: number | null) {
  const id = await standupRepo.upsert(data, actorId);

  const botUrl = process.env.DISCORD_BOT_URL;
  const botToken = process.env.DISCORD_INTERNAL_TOKEN;
  if (botUrl && botToken) {
    const employee = await employeeRepo.findNameById(data.employee_id);
    fetch(`${botUrl}/internal/standup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Token': botToken },
      body: JSON.stringify({
        employeeName: employee?.name || `Employee #${data.employee_id}`,
        yesterday: data.yesterday,
        today: data.today,
        blockers: data.blockers,
      }),
    }).catch((err: any) => console.error('[discord-bot] HR → Discord sync failed:', err.message));
  }

  return id;
}
