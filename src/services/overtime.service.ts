import * as overtimeRepo from '../repositories/overtime.repository';
import * as employeeRepo from '../repositories/employee.repository';
import * as payrollAdjustmentRepo from '../repositories/payrollAdjustment.repository';
import AppError from '../pkg/AppError';
import type { OvertimeCreateInput, OvertimeUpdateInput } from '../dtos/overtime.dto';
import { toMonthlySalary, calculateOvertimePay } from '../pkg/payrollCalculator';

interface AuthUser {
  id: number;
  role: string;
}

export async function list(user: AuthUser, employeeIdFilter?: string, status?: string) {
  const privileged = ['admin', 'lead'].includes(user.role);
  const filterEmployeeId = privileged ? employeeIdFilter : user.id;
  return overtimeRepo.findWithNames({ employeeId: filterEmployeeId, status });
}

export async function create(data: OvertimeCreateInput) {
  return overtimeRepo.create(data);
}

export async function update(id: string, updates: OvertimeUpdateInput, userId: number) {
  const ot = await overtimeRepo.findById(id);
  if (!ot) throw new AppError('Not found', 404);
  if (ot.employee_id !== userId) throw new AppError('You can only edit your own overtime requests', 403);
  if (ot.status !== 'pending') throw new AppError('Only pending overtime requests can be edited', 400);
  await overtimeRepo.update(id, updates, userId);
}

export async function cancel(id: string, userId: number) {
  const ot = await overtimeRepo.findById(id);
  if (!ot) throw new AppError('Not found', 404);
  if (ot.employee_id !== userId) throw new AppError('You can only cancel your own overtime requests', 403);
  if (ot.status !== 'pending') throw new AppError('Only pending overtime requests can be cancelled', 400);
  await overtimeRepo.remove(id);
}

export async function approve(id: string, user: AuthUser) {
  if (user.role === 'employee') throw new AppError('Insufficient permissions', 403);

  const ot: any = await overtimeRepo.findWithEmployeeById(id);
  if (!ot) throw new AppError('Not found', 404);

  if (user.role === 'lead' && ot.employee_id === user.id) {
    throw new AppError('Team leads cannot approve their own overtime requests', 403);
  }
  if (ot.status !== 'pending') {
    throw new AppError('Only pending overtime requests can be reviewed', 400);
  }

  const emp = await employeeRepo.findPayrollBaseById(ot.employee_id);
  if (!emp?.salary) {
    throw new AppError("This employee's salary isn't configured yet — set it under Payroll first", 400);
  }

  const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
  const { hourlyRate, overtimeHourlyRate, amount } = calculateOvertimePay(monthlySalary, ot.hours);

  await overtimeRepo.approve(id, user.id, { hourlyRate, overtimeRate: overtimeHourlyRate, amount });

  const workDate = new Date(ot.work_date);
  const projectLabel = ot.project_name || 'General duties';
  await payrollAdjustmentRepo.create({
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
}

export async function reject(id: string, user: AuthUser) {
  if (user.role === 'employee') throw new AppError('Insufficient permissions', 403);

  const ot = await overtimeRepo.findById(id);
  if (!ot) throw new AppError('Not found', 404);

  if (user.role === 'lead' && ot.employee_id === user.id) {
    throw new AppError('Team leads cannot reject their own overtime requests', 403);
  }
  if (ot.status !== 'pending') {
    throw new AppError('Only pending overtime requests can be reviewed', 400);
  }

  await overtimeRepo.reject(id, user.id);
}
