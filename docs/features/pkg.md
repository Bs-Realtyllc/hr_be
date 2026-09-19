# pkg

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
The `pkg` module contains utility functions and calculations related to payroll, tax, and error handling in a hypothetical payroll system. It includes error classes, functions to calculate monthly and hourly salaries, overtime pay, leave deductions, and year-end bonus, as well as tax bracket calculations.

## Where it lives in the UI
N/A

## Key flows
1. **Payroll Calculations:**
   - Use the `toMonthlySalary`, `getDailyRate`, `getHourlyRate`, `calculateOvertimePay`, and `calculateLeaveDeduction` functions to calculate payroll components such as monthly salary, daily rate, hourly rate, overtime pay, and leave deductions.
   - Use the `estimateAnnualTax` function to calculate annual tax based on taxable income.

2. **Tax Bracket Calculations:**
   - Utilize the `TAX_BRACKETS` array to determine the tax rate for different income brackets.
   - Use the `estimateAnnualTax` function to estimate annual tax based on a provided taxable income.

3. **Error Handling:**
   - Use the `bindAndValidate` function to validate input data against a provided schema and handle errors by throwing an `AppError` with an optional custom message and status code.

## Known limitations / in-progress
- The `toAnnualSalary` function assumes a fixed pay frequency and does not account for variations in pay frequency.
- The `round2` function, which rounds a number to two decimal places, is used in various calculations but does not have a defined implementation in this module.
- The module lacks comprehensive documentation for some functions, particularly related to input validation and error handling, which may require further clarification or expansion.
- The `optionalNullable` function is defined but not used in the provided code, indicating it may be part of a larger system and should be referenced for more context.
