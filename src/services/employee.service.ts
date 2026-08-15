import * as employeeRepo from '../repositories/employee.repository';
import type { EmployeeCreateInput, EmployeeUpdateInput } from '../dtos/employee.dto';
import AppError from '../pkg/AppError';
// Not yet converted to Sequelize — still a raw-SQL model file, required as-is.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PayrollAdjustment = require('../models/PayrollAdjustment');

// Business logic only — no req/res, no raw request bodies. Every input here
// is already bound+validated by the controller via employee.dto.ts.

export async function list() {
  return employeeRepo.findAllActive();
}

export async function get(id: string) {
  return employeeRepo.findById(id);
}

export async function create(data: EmployeeCreateInput, actorId: number | null) {
  const id = await employeeRepo.create(data, actorId);

  // Seed default leave balances for current year
  const year = new Date().getFullYear();
  await employeeRepo.seedLeaveBalances(id, year);

  return id;
}

export async function update(id: string, updates: EmployeeUpdateInput, actorId: number | null) {
  if (!Object.keys(updates).length) {
    throw new AppError('Nothing to update', 400);
  }
  await employeeRepo.update(id, updates, actorId);
}

export async function remove(id: string, actorId: number | null) {
  await employeeRepo.deactivate(id, actorId);
}

// Payroll summary for an employee for the current month: working days,
// approved-leave days, present days, expected pay, plus any overtime/leave
// adjustments booked for the period. Moved here unchanged from
// controllers/employees.js — pure calculation, no HTTP concerns.
export async function payrollSummary(id: string) {
  const emp = await employeeRepo.findPayrollBaseById(id);
  if (!emp) {
    const err: any = new Error('Not found');
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Count Mon–Fri working days in current month
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const leaveRanges = await employeeRepo.findApprovedLeaveRangesForEmployee(id, monthStart, monthEnd);

  let leaveDays = 0;
  for (const lr of leaveRanges as any[]) {
    const s = new Date(Math.max(new Date(lr.start_date).getTime(), new Date(monthStart).getTime()));
    const e = new Date(Math.min(new Date(lr.end_date).getTime(), new Date(monthEnd).getTime()));
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) leaveDays++;
    }
  }

  const presentDays = workingDays - leaveDays;
  // Drizzle (like mysql2's own default decimalNumbers:false) returns DECIMAL
  // columns as strings — same as the original raw-SQL code, which relied on
  // JS's implicit string->number coercion here; explicit Number() now that
  // the compiler is checking it.
  const dailyRate = emp.salary ? Number(emp.salary) / workingDays : 0;
  const expectedPay = dailyRate * presentDays;

  // Overtime pay / leave deductions booked for this month, plus any year-end leave
  // bonus already paid out for this year — each carries its own display title.
  const adjustments = await PayrollAdjustment.findForEmployeePeriod(id, year, month + 1);
  const overtimePay = adjustments.filter((a: any) => a.type === 'overtime_pay').reduce((s: number, a: any) => s + Number(a.amount), 0);
  const leaveDeduction = adjustments.filter((a: any) => a.type === 'leave_deduction').reduce((s: number, a: any) => s + Number(a.amount), 0);
  const leaveBonus = adjustments.filter((a: any) => a.type === 'leave_bonus').reduce((s: number, a: any) => s + Number(a.amount), 0);

  return {
    ...emp,
    working_days_this_month: workingDays,
    leave_days_this_month: leaveDays,
    present_days: presentDays,
    daily_rate: Math.round(dailyRate),
    expected_pay: Math.round(expectedPay),
    overtime_pay: Math.round(overtimePay),
    leave_deduction: Math.round(leaveDeduction),
    leave_bonus: Math.round(leaveBonus),
    net_pay: Math.round(expectedPay + overtimePay + leaveDeduction + leaveBonus),
    adjustments: adjustments.map((a: any) => ({ title: a.title, type: a.type, amount: Number(a.amount) })),
  };
}
