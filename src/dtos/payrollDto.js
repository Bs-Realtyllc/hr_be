const { z } = require('zod');

// Matches employees.pay_frequency ENUM in schema.sql.
const PAY_FREQUENCIES = ['monthly', 'biweekly', 'weekly'];
// Matches employee_tax_profiles.filing_status / tax_regime ENUMs in schema.sql.
const FILING_STATUSES = ['single', 'married', 'head_of_household'];
const TAX_REGIMES = ['old', 'new'];

const salarySchema = z.object({
  salary: z.coerce.number().nonnegative().nullable(),
  pay_frequency: z.enum(PAY_FREQUENCIES),
});

function throwBadRequest(message) {
  const err = new Error(message);
  err.status = 400;
  throw err;
}

// Shapes the salary-update body into the (salary, pay_frequency) values expected
// by Employee.updateSalary — mirrors the original controller's ?? defaulting.
exports.toUpdateSalaryInput = (body) => {
  const result = salarySchema.safeParse({
    salary: body.salary ?? null,
    pay_frequency: body.pay_frequency ?? 'monthly',
  });
  if (!result.success) throwBadRequest(result.error.issues[0].message);
  return result.data;
};

// Returns an error message string if the password fails validation, otherwise null.
// Kept as a plain validator (not a throw) so callers can preserve the original
// early-return-with-400 behavior without it being swallowed by a generic
// catch-all 500 handler.
exports.validatePasswordReset = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

const taxProfileSchema = z.object({
  tax_id: z.string().trim().nullable(),
  country: z.string().trim().min(1),
  filing_status: z.enum(FILING_STATUSES),
  tax_regime: z.enum(TAX_REGIMES),
  exemptions: z.coerce.number().nonnegative(),
  additional_withholding: z.coerce.number().nonnegative(),
  notes: z.string().trim().nullable(),
});

exports.toTaxProfileInput = (body) => {
  const result = taxProfileSchema.safeParse({
    tax_id: body.tax_id || null,
    country: body.country || 'Nepal',
    filing_status: body.filing_status || 'single',
    tax_regime: body.tax_regime || 'new',
    exemptions: body.exemptions ?? 0,
    additional_withholding: body.additional_withholding ?? 0,
    notes: body.notes || null,
  });
  if (!result.success) throwBadRequest(result.error.issues[0].message);
  return result.data;
};
