import * as employeeRepo from '../repositories/employee.repository';
import * as leaveRepo from '../repositories/leave.repository';

const DEFAULT_LEAVE_TYPE = 'sick';

export async function handleLeaveApproved({
  personName,
  personEmail,
  leave_type,
}: {
  personName: string;
  personEmail: string;
  leave_type?: string;
}) {
  let employee: any = await employeeRepo.findByEmail(personEmail);
  if (!employee) {
    employee = await employeeRepo.findBySecondaryEmail(personEmail);
  }
  if (!employee) {
    console.error(`[leave-events] No employee matched for "${personEmail}" (name "${personName}")`);
    return;
  }

  const type = leave_type || DEFAULT_LEAVE_TYPE;
  const today = new Date().toISOString().split('T')[0];

  const leaveId = await leaveRepo.create({
    employee_id: employee.id,
    leave_type: type,
    start_date: today,
    end_date: today,
    reason: 'Approved externally via n8n',
  });
  await leaveRepo.approveExternally(leaveId);

  const year = new Date().getFullYear();
  await leaveRepo.incrementBalanceTaken(employee.id, type, year, 1);

  console.log(`[leave-events] Recorded approved leave for ${employee.name} today (${today}, ${type}) — balance deducted`);
}
