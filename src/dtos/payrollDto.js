// Shapes the salary-update body into the (salary, pay_frequency) values expected
// by Employee.updateSalary — mirrors the original controller's ?? defaulting.
exports.toUpdateSalaryInput = (body) => ({
  salary: body.salary ?? null,
  pay_frequency: body.pay_frequency ?? 'monthly',
});

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
