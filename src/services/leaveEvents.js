const Employee = require('../repositories/employee.repository');
const LeaveRequest = require('../models/LeaveRequest');

const DEFAULT_LEAVE_TYPE = 'sick'; // fallback if a future payload omits leave_type

exports.handleLeaveApproved = async ({ personName, personEmail, leave_type }) => {
  let employee = await Employee.findByEmail(personEmail);
  if (!employee) {
    employee = await Employee.findBySecondaryEmail(personEmail);
  }
  if (!employee) {
    console.error(`[leave-events] No employee matched for "${personEmail}" (name "${personName}")`);
    return;
  }

  const type = leave_type || DEFAULT_LEAVE_TYPE;
  const today = new Date().toISOString().split('T')[0];

  const leaveId = await LeaveRequest.create({
    employee_id: employee.id,
    leave_type: type,
    start_date: today,
    end_date: today,
    reason: 'Approved externally via n8n',
  });
  await LeaveRequest.approveExternally(leaveId);

  const year = new Date().getFullYear();
  await LeaveRequest.incrementBalanceTaken(employee.id, type, year, 1);

  console.log(`[leave-events] Recorded approved leave for ${employee.name} today (${today}, ${type}) — balance deducted`);
};
