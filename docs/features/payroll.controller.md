# Payroll

**Status:** released (~100%)

**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This module handles payroll operations such as updating salaries, resetting passwords, retrieving taxes, adjusting pay, and generating year-end bonus reports.

## Where it lives in the UI
- Backend API routes for `getPayroll`, `updateSalary`, `resetPassword`, `getTaxes`, `updateTaxProfile`, `getAdjustments`, `getSummary`, and `runYearEndBonus`.

## Key flows
1. **Update Salary**: Navigate to the backend API route `updateSalary` to update an employee's salary. Provide necessary parameters including `salary`, `pay_frequency`, and `user_id`.
2. **Reset Password**: Use the backend API route `resetPassword` to reset an employee's password. Provide the employee's ID and a new password.
3. **Retrieve Taxes**: Utilize the backend API route `getTaxes` to fetch taxes for an employee. Specify the `month` and `year` query parameters.
4. **Update Tax Profile**: Access the backend API route `updateTaxProfile` to modify an employee's tax profile. Provide the employee's ID and the new tax profile details.
5. **Retrieve Adjustments**: Use the backend API route `getAdjustments` to get adjustments for an employee. Include `employee_id`, `year`, and `month` in the query parameters.
6. **Build Summary**: Call the backend API route `getSummary` to obtain a summary for a user. This is useful for getting a comprehensive view of payroll details.
7. **Run Year-End Bonus**: Execute the backend API route `runYearEndBonus` to run the year-end bonus calculation. Specify the `year` parameter to define the year of the bonus.

## Known limitations / in-progress
- Ensure proper validation and error handling for all API calls.
- Test edge cases and ensure security for password reset and salary updates.
- Implement caching for frequently queried payroll data to improve performance.
