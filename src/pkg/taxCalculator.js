// Simplified progressive tax-slab estimate based on Nepal's individual income tax
// slabs (Income Tax Act, current schedule for resident natural persons; NPR amounts).
// For illustration/estimation purposes only — not a substitute for a real payroll/tax engine,
// and does not account for Social Security Fund contributions, remote allowance, or other credits.
const INDIVIDUAL_BRACKETS = [
  { upTo: 500000, rate: 0.01 },
  { upTo: 700000, rate: 0.10 },
  { upTo: 1000000, rate: 0.20 },
  { upTo: 2000000, rate: 0.30 },
  { upTo: Infinity, rate: 0.36 },
];

const COUPLE_BRACKETS = [
  { upTo: 600000, rate: 0.01 },
  { upTo: 800000, rate: 0.10 },
  { upTo: 1100000, rate: 0.20 },
  { upTo: 2000000, rate: 0.30 },
  { upTo: Infinity, rate: 0.36 },
];

function bracketsFor(filingStatus) {
  return filingStatus === 'married' ? COUPLE_BRACKETS : INDIVIDUAL_BRACKETS;
}

function estimateAnnualTax(taxableIncome, filingStatus) {
  if (!taxableIncome || taxableIncome <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of bracketsFor(filingStatus)) {
    if (taxableIncome <= lower) break;
    const slice = Math.min(taxableIncome, upTo) - lower;
    tax += slice * rate;
    lower = upTo;
  }
  return Math.round(tax);
}

function toAnnualSalary(salary, payFrequency) {
  if (!salary) return 0;
  if (payFrequency === 'biweekly') return salary * 26;
  if (payFrequency === 'weekly') return salary * 52;
  return salary * 12;
}

exports.INDIVIDUAL_BRACKETS = INDIVIDUAL_BRACKETS;
exports.COUPLE_BRACKETS = COUPLE_BRACKETS;
exports.estimateAnnualTax = estimateAnnualTax;
exports.toAnnualSalary = toAnnualSalary;
