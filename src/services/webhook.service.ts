import AppError from "../pkg/AppError";

import * as leaveRepo from "../repositories/leave.repository";
import * as performanceRepo from "../repositories/performanceReview.repository";
import * as employeeTaxRepo from "../repositories/employeeTax.repository";
import * as payrollAdjustmentRepo from "../repositories/payrollAdjustment.repository";

import { toMonthlySalary } from "../pkg/payrollCalculator";
import { withTaxEstimate } from "./payroll.service";

function daysTakenByEmployee(ranges: any[], rangeStart: Date, rangeEnd: Date) {
  const map: Record<number, number> = {};
  for (const r of ranges) {
    const s = new Date(
      Math.max(new Date(r.start_date).getTime(), rangeStart.getTime()),
    );
    const e = new Date(
      Math.min(new Date(r.end_date).getTime(), rangeEnd.getTime()),
    );
    const days =
      Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    map[r.employee_id] = (map[r.employee_id] || 0) + Math.max(days, 0);
  }
  return map;
}

export async function leave_report() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const thisMonthStart = new Date(year, month, 1);
  const thisMonthEnd = new Date(year, month + 1, 0);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const [balancesRows, thisMonthRanges] = await Promise.all([
    leaveRepo.findBalanceTotalsForYear(year),
    leaveRepo.findApprovedRangesForAllInRange(
      fmt(thisMonthStart),
      fmt(thisMonthEnd),
    ),
  ]);
  const thisMonthMap = daysTakenByEmployee(
    thisMonthRanges as any[],
    thisMonthStart,
    thisMonthEnd,
  );

  return balancesRows.map((b: any) => ({
    employee_id: b.employee_id,
    employee_name: b.employee_name,
    total_leaves: Number(b.total_leaves),
    taken_this_month: thisMonthMap[b.employee_id] || 0,
    remaining_leaves: Number(b.total_leaves) - Number(b.total_taken),
  }));
}

export async function performance_report() {
  return performanceRepo.findWithNames({});
}

export async function financial_report() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth()+1;
//   console.log(month, year);

  const [taxRows, totals] = await Promise.all([
    employeeTaxRepo.findAllWithProfile(null, month, year),
    payrollAdjustmentRepo.summaryForPeriod(year, month),
  ]);
  const totalsByEmployee = Object.fromEntries(
    totals.map((t: any) => [t.employee_id, t]),
  );

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
