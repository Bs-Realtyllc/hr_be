# Employee Controller

**Status:** released (~100%)

**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This API controller handles operations related to employees, including listing, creating, updating, and approving/rejecting their onboarding status and payroll summary.

## Where it lives in the UI
N/A

## Key flows
1. **List all employees**: Navigate to the list endpoint to retrieve a list of all employees.
2. **List onboarding employees**: Navigate to the listOnboarding endpoint to retrieve a list of onboarding employees.
3. **Retrieve an employee**: Navigate to the get endpoint to retrieve a specific employee by their ID.
4. **Create a new employee**: Use the create endpoint with the appropriate payload to create a new employee.
5. **Update an employee**: Use the update endpoint with the appropriate payload and employee ID to update an existing employee's information.
6. **Approve an employee**: Use the approve endpoint with the employee ID to approve their onboarding status.
7. **Reject an employee**: Use the reject endpoint with the employee ID and optional send_mail parameter to reject their onboarding status and send an email if specified.
8. **Retrieve payroll summary**: Use the payrollSummary endpoint with the employee ID to retrieve their payroll summary.

## Known limitations / in-progress
- None.
