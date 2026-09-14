```md
# Payroll Controller

**Status:** released (~80% complete) (~2026-09-14)

## What it does
The Payroll Controller provides various functionalities for managing employee payrolls, including getting payroll data, updating salaries, resetting passwords, getting taxes, updating tax profiles, getting adjustments, building summary reports, and running year-end bonuses.

## Where it lives in the UI
- Backend API routes for the following operations: `getPayroll`, `updateSalary`, `resetPassword`, `getTaxes`, `updateTaxProfile`, `getAdjustments`, `getSummary`, `runYearEndBonus`, `getFinancialReport`.

## Key flows
1. **Get Payroll**: Retrieve payroll data based on user privileges and employee ID.
2. **Update Salary**: Modify employee salary details via provided ID, frequency, and user ID.
3. **Reset Password**: Change employee password via provided ID and new password.
4. **Get Taxes**: Fetch payroll taxes for a specific month and year based on user privileges and employee ID.
5. **Update Tax Profile**: Update tax profile details for an employee via provided ID.
6. **Get Adjustments**: Fetch payroll adjustments for an employee based on provided ID, year, and month.
7. **Build Summary**: Generate payroll summary report for a specific user ID.
8. **Run Year End Bonus**: Execute year-end bonus for a given year.
9. **Build Financial Report**: Generate financial report for a specified employee ID, year, and month.

## Known limitations / in-progress
- Ensuring all required permissions and roles are correctly validated.
- Handling edge cases for date inputs, such as leap years and month ranges.
- Ensuring accurate data retrieval and updating for payroll records.
- Optimizing performance for large datasets and frequent API calls.
- Implementing comprehensive error handling and validation for user inputs.
- Ensuring consistent and accurate reporting generation.
```
