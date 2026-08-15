
export interface TaxBracket {
  upTo: number;
  rate: number;
}

export const INDIVIDUAL_BRACKETS: TaxBracket[] = [
  { upTo: 500000, rate: 0.01 },
  { upTo: 700000, rate: 0.1 },
  { upTo: 1000000, rate: 0.2 },
  { upTo: 2000000, rate: 0.3 },
  { upTo: Infinity, rate: 0.36 },
];

export const COUPLE_BRACKETS: TaxBracket[] = [
  { upTo: 600000, rate: 0.01 },
  { upTo: 800000, rate: 0.1 },
  { upTo: 1100000, rate: 0.2 },
  { upTo: 2000000, rate: 0.3 },
  { upTo: Infinity, rate: 0.36 },
];

function bracketsFor(filingStatus: string): TaxBracket[] {
  return filingStatus === 'married' ? COUPLE_BRACKETS : INDIVIDUAL_BRACKETS;
}

export function estimateAnnualTax(taxableIncome: number, filingStatus: string): number {
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

export function toAnnualSalary(salary: number, payFrequency: string): number {
  if (!salary) return 0;
  if (payFrequency === 'biweekly') return salary * 26;
  if (payFrequency === 'weekly') return salary * 52;
  return salary * 12;
}
