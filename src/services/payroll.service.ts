import bcrypt from 'bcryptjs';
import * as employeeRepo from '../repositories/employee.repository';
import * as leaveRepo from '../repositories/leave.repository';
import * as payrollAdjustmentRepo from '../repositories/payrollAdjustment.repository';
import * as employeeTaxRepo from '../repositories/employeeTax.repository';
import AppError from '../pkg/AppError';
import { estimateAnnualTax, toAnnualSalary } from '../pkg/taxCalculator';
import { toMonthlySalary, calculateYearEndLeaveBonus } from '../pkg/payrollCalculator';

export function withTaxEstimate(r: any) {
  const annualSalary = toAnnualSalary(r.salary, r.pay_frequency);
  const monthlySalary = toMonthlySalary(r.salary, r.pay_frequency);
  const estimatedAnnualTax = estimateAnnualTax(annualSalary);
  const estimatedMonthlyTax = Math.round(estimatedAnnualTax / 12);

  const amount = r.amount != null ? Number(r.amount) : Math.round(monthlySalary);
  const taxAmount = r.tax_amount != null ? Number(r.tax_amount) : estimatedMonthlyTax;
  const taxPerc = r.tax_perc != null ? Number(r.tax_perc) : annualSalary > 0 ? Number(((estimatedAnnualTax / annualSalary) * 100).toFixed(1)) : 0;

  return {
    ...r,
    annual_salary: Math.round(annualSalary),
    amount,
    tax_amount: taxAmount,
    tax_perc: taxPerc,
    estimated_annual_tax: estimatedAnnualTax,
    estimated_monthly_tax: estimatedMonthlyTax,
  };
}

export async function getPayroll(privileged: boolean, userId: number) {
  return employeeRepo.findPayrollColumns(privileged ? null : userId);
}

export async function updateSalary(id: string, salary: number | null, payFrequency: string, actorId: number | null) {
  await employeeRepo.updateSalary(id, salary, payFrequency, actorId);
}

export async function resetPassword(id: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  await employeeRepo.updatePasswordHash(id, hash);
}

export async function getTaxes(privileged: boolean, userId: number, month: number, year: number) {
  const rows = await employeeTaxRepo.findAllWithProfile(privileged ? null : userId, month, year);
  return rows.map(withTaxEstimate);
}

export async function updateTaxProfile(
  id: string,
  data: { month: number; year: number; amount: number | null; tax_amount: number | null; tax_perc: number | null }
) {
  const panNo = await employeeTaxRepo.findPanNoById(id);
  if (!panNo) {
    throw new AppError('This employee has no panNo on file — set one before recording a tax profile', 400);
  }

  let { amount, tax_amount, tax_perc } = data;
  if (amount == null || tax_amount == null || tax_perc == null) {
    const base = await employeeRepo.findPayrollBaseById(id);
    const computed = withTaxEstimate(base || {});
    amount = amount ?? computed.amount;
    tax_amount = tax_amount ?? computed.tax_amount;
    tax_perc = tax_perc ?? computed.tax_perc;
  }

  await employeeTaxRepo.upsertProfile(panNo, data.month, data.year, { amount, tax_amount, tax_perc });
}

export async function getAdjustments(
  privileged: boolean,
  userId: number,
  employeeId?: string,
  year?: string,
  month?: string
) {
  return payrollAdjustmentRepo.findAll({
    employeeId: privileged ? employeeId || null : userId,
    year: year ? Number(year) : null,
    month: month ? Number(month) : null,
  });
}

export async function buildSummary(privileged: boolean, userId: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [rows, totals] = await Promise.all([
    employeeRepo.findPayrollColumns(privileged ? null : userId),
    payrollAdjustmentRepo.summaryForPeriod(year, month),
  ]);
  const totalsByEmployee = Object.fromEntries(totals.map((t: any) => [t.employee_id, t]));

  return rows.map((r: any) => {
    const baseMonthly = toMonthlySalary(r.salary, r.pay_frequency);
    const t = totalsByEmployee[r.id] || { overtime_pay: 0, leave_deduction: 0, leave_bonus: 0 };
    const overtimePay = Number(t.overtime_pay);
    const leaveDeduction = Number(t.leave_deduction);
    const leaveBonus = Number(t.leave_bonus);

    return {
      id: r.id,
      name: r.name,
      designation: r.designation,
      department: r.department,
      role: r.role,
      base_monthly: Math.round(baseMonthly),
      overtime_pay: Math.round(overtimePay),
      leave_deduction: Math.round(leaveDeduction),
      leave_bonus: Math.round(leaveBonus),
      net_pay: Math.round(baseMonthly + overtimePay + leaveDeduction + leaveBonus),
    };
  });
}

export async function runYearEndBonus(year: number) {
  const employees = await employeeRepo.findPayrollColumns(null);

  let processed = 0;
  let totalBonus = 0;
  const details: any[] = [];

  for (const emp of employees as any[]) {
    if (!emp.salary) continue;
    if (await payrollAdjustmentRepo.existsBonusForYear(emp.id, year)) continue;

    const balances = await leaveRepo.findBalances(emp.id, year);
    const remainingDays = balances.reduce((sum: number, b: any) => sum + Math.max(Number(b.remaining) || 0, 0), 0);
    if (remainingDays <= 0) continue;

    const monthlySalary = toMonthlySalary(emp.salary, emp.pay_frequency);
    const { dailyRate, amount } = calculateYearEndLeaveBonus(monthlySalary, remainingDays);
    if (amount <= 0) continue;

    await payrollAdjustmentRepo.create({
      employee_id: emp.id,
      type: 'leave_bonus',
      title: `Year-End Leave Bonus — ${remainingDays} unused day(s) (${year})`,
      amount,
      year,
      month: null,
      reference_type: null,
      reference_id: null,
      notes: `Daily rate Rs. ${dailyRate} × ${remainingDays} unused day(s)`,
    });

    processed += 1;
    totalBonus += amount;
    details.push({ employee_id: emp.id, name: emp.name, remaining_days: remainingDays, amount });
  }

  return { year, processed, total_bonus: Math.round(totalBonus), details };
}

export async function buildFinancialReport(filterEmployeeId: string | null, year: number, month: number) {
  const [taxRows, totals] = await Promise.all([
    employeeTaxRepo.findAllWithProfile(filterEmployeeId, month, year),
    payrollAdjustmentRepo.summaryForPeriod(year, month),
  ]);
  const totalsByEmployee = Object.fromEntries(totals.map((t: any) => [t.employee_id, t]));

  return taxRows.map((raw: any) => {
    const r = withTaxEstimate(raw);
    const t = totalsByEmployee[r.id] || { overtime_pay: 0, leave_deduction: 0 };

    const baseSalary = toMonthlySalary(r.salary, r.pay_frequency);
    const overtimePay = Number(t.overtime_pay);
    const deductedAmount = Math.abs(Number(t.leave_deduction));
    const taxAmount = r.tax_amount;
    const totalPayable = baseSalary + overtimePay - deductedAmount - taxAmount;

    return {
      id: r.id,
      name: r.name,
      designation: r.designation,
      department: r.department,
      role: r.role,
      base_salary: Math.round(baseSalary),
      overtime_pay: Math.round(overtimePay),
      deducted_amount: Math.round(deductedAmount),
      tax_amount: Math.round(taxAmount),
      total_payable: Math.round(totalPayable),
    };
  });
}
