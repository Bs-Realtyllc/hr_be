// Payroll adjustment formulas — overtime pay, leave-balance-exceeded deductions,
// and year-end unused-leave bonuses. A standard 26 working-day, 8-hour month is
// used as the reference base for all per-day/per-hour rates, per company policy.
export const WORKING_DAYS_PER_MONTH = 26;
export const WORKING_HOURS_PER_DAY = 8;
export const OVERTIME_MULTIPLIER = 1.5; // 150% of the normal hourly rate

export function toMonthlySalary(salary: number | string | null | undefined, payFrequency: string | null | undefined): number {
  const amount = Number(salary) || 0;
  if (!amount) return 0;
  if (payFrequency === 'biweekly') return (amount * 26) / 12;
  if (payFrequency === 'weekly') return (amount * 52) / 12;
  return amount;
}

export function getDailyRate(monthlySalary: number): number {
  return monthlySalary / WORKING_DAYS_PER_MONTH;
}

export function getHourlyRate(monthlySalary: number): number {
  return monthlySalary / (WORKING_DAYS_PER_MONTH * WORKING_HOURS_PER_DAY);
}

// hours worked as overtime -> { hourlyRate, overtimeHourlyRate, amount } paid at 150% of the normal rate.
export function calculateOvertimePay(monthlySalary: number, hours: number | string) {
  const hourlyRate = getHourlyRate(monthlySalary);
  const overtimeHourlyRate = hourlyRate * OVERTIME_MULTIPLIER;
  const amount = overtimeHourlyRate * (Number(hours) || 0);
  return {
    hourlyRate: round2(hourlyRate),
    overtimeHourlyRate: round2(overtimeHourlyRate),
    amount: round2(amount),
  };
}

// excessDays = leave days taken beyond the employee's remaining balance -> deduction amount.
export function calculateLeaveDeduction(monthlySalary: number, excessDays: number) {
  const dailyRate = getDailyRate(monthlySalary);
  const amount = dailyRate * Math.max(Number(excessDays) || 0, 0);
  return { dailyRate: round2(dailyRate), amount: round2(amount) };
}

// remainingDays = unused leave balance at year end -> bonus amount, at the same daily rate.
export function calculateYearEndLeaveBonus(monthlySalary: number, remainingDays: number) {
  const dailyRate = getDailyRate(monthlySalary);
  const amount = dailyRate * Math.max(Number(remainingDays) || 0, 0);
  return { dailyRate: round2(dailyRate), amount: round2(amount) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
