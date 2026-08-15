const OvertimeRequest = require('../models/OvertimeRequest');
const Employee = require('../models/Employee');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const { toMonthlySalary, calculateOvertimePay } = require('../pkg/payrollCalculator');

// Approves an overtime request: validates role/ownership/status, computes the
// overtime pay at 150% of the hourly rate, records it, and books a payroll
// adjustment. Throws an Error with `.status` set for the controller to map to HTTP.
exports.approve = async (id, user) => {
  const role = user?.role;
  if (role === 'employee') {
    const err = new Error('Insufficient permissions');
    err.status = 403;
    throw err;
  }

  const ot = await OvertimeRequest.findWithEmployeeById(id);
  if (!ot) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  if (role === 'lead' && ot.employee_id === user.id) {
    const err = new Error('Team leads cannot approve their own overtime requests');
    err.status = 403;
    throw err;
  }
  if (ot.status !== 'pending') {
    const err = new Error('Only pending overtime requests can be reviewed');
    err.status = 400;
    throw err;
  }

  const emp = await Employee.findPayrollBaseById(ot.employee_id);
  if (!emp?.salary) {
    const err = new Error("This employee's salary isn't configured yet — set it under Payroll first");
    err.status = 400;
    throw err;
  }

  const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
  const { hourlyRate, overtimeHourlyRate, amount } = calculateOvertimePay(monthlySalary, ot.hours);

  await OvertimeRequest.approve(id, user.id, { hourlyRate, overtimeRate: overtimeHourlyRate, amount });

  const workDate = new Date(ot.work_date);
  const projectLabel = ot.project_name || 'General duties';
  await PayrollAdjustment.create({
    employee_id: ot.employee_id,
    type: 'overtime_pay',
    title: `Overtime Pay — ${Number(ot.hours)}h @ 150% rate (${projectLabel})`,
    amount,
    year: workDate.getFullYear(),
    month: workDate.getMonth() + 1,
    reference_type: 'overtime_request',
    reference_id: ot.id,
    notes: `Hourly rate Rs. ${hourlyRate} × 1.5 = Rs. ${overtimeHourlyRate}/hr`,
  });

  return { amount };
};

// Rejects an overtime request: validates role/ownership/status, marks it rejected.
exports.reject = async (id, user) => {
  const role = user?.role;
  if (role === 'employee') {
    const err = new Error('Insufficient permissions');
    err.status = 403;
    throw err;
  }

  const ot = await OvertimeRequest.findById(id);
  if (!ot) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  if (role === 'lead' && ot.employee_id === user.id) {
    const err = new Error('Team leads cannot reject their own overtime requests');
    err.status = 403;
    throw err;
  }
  if (ot.status !== 'pending') {
    const err = new Error('Only pending overtime requests can be reviewed');
    err.status = 400;
    throw err;
  }

  await OvertimeRequest.reject(id, user.id);
};
