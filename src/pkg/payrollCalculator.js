// Payroll adjustment formulas — overtime pay, leave-balance-exceeded deductions,
// and year-end unused-leave bonuses. A standard 26 working-day, 8-hour month is
// used as the reference base for all per-day/per-hour rates, per company policy.
const WORKING_DAYS_PER_MONTH = 26;
const WORKING_HOURS_PER_DAY = 8;
const OVERTIME_MULTIPLIER = 1.5; // 150% of the normal hourly rate

function toMonthlySalary(salary, payFrequency) {
  const amount = Number(salary) || 0;
  if (!amount) return 0;
  if (payFrequency === 'biweekly') return (amount * 26) / 12;
  if (payFrequency === 'weekly') return (amount * 52) / 12;
  return amount;
}

function getDailyRate(monthlySalary) {
  return monthlySalary / WORKING_DAYS_PER_MONTH;
}

function getHourlyRate(monthlySalary) {
  return monthlySalary / (WORKING_DAYS_PER_MONTH * WORKING_HOURS_PER_DAY);
}

// hours worked as overtime -> { hourlyRate, overtimeHourlyRate, amount } paid at 150% of the normal rate.
function calculateOvertimePay(monthlySalary, hours) {
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
function calculateLeaveDeduction(monthlySalary, excessDays) {
  const dailyRate = getDailyRate(monthlySalary);
  const amount = dailyRate * Math.max(Number(excessDays) || 0, 0);
  return { dailyRate: round2(dailyRate), amount: round2(amount) };
}

// remainingDays = unused leave balance at year end -> bonus amount, at the same daily rate.
function calculateYearEndLeaveBonus(monthlySalary, remainingDays) {
  const dailyRate = getDailyRate(monthlySalary);
  const amount = dailyRate * Math.max(Number(remainingDays) || 0, 0);
  return { dailyRate: round2(dailyRate), amount: round2(amount) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  WORKING_DAYS_PER_MONTH,
  WORKING_HOURS_PER_DAY,
  OVERTIME_MULTIPLIER,
  toMonthlySalary,
  getDailyRate,
  getHourlyRate,
  calculateOvertimePay,
  calculateLeaveDeduction,
  calculateYearEndLeaveBonus,
};
