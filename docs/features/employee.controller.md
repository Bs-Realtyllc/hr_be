# Employee Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller provides various operations for managing employees, including listing all employees, listing employees onboarding, retrieving a single employee by ID, creating a new employee, updating an existing employee, removing an employee, approving an employee, rejecting an employee, and generating a payroll summary.

## Where it lives in the UI
- Backend API routes for `list`, `listOnboarding`, `get`, `create`, `update`, `remove`, `approve`, `reject`, and `payrollSummary`.

## Key flows
1. **List all employees**: The `/api/employees` route lists all employees in the system.
2. **List employees onboarding**: The `/api/employees/onboarding` route lists employees who are currently onboarding.
3. **Retrieve an employee by ID**: The `/api/employees/:id` route retrieves details of a specific employee.
4. **Create a new employee**: The `/api/employees` route's `create` method creates a new employee with the provided input.
5. **Update an existing employee**: The `/api/employees/:id` route's `update` method updates the specified employee with the provided input.
6. **Remove an employee**: The `/api/employees/:id` route's `remove` method deletes the specified employee.
7. **Approve an employee**: The `/api/employees/:id/approve` route approves the specified employee.
8. **Reject an employee**: The `/api/employees/:id/reject` route rejects the specified employee.
9. **Generate a payroll summary**: The `/api/employees/:id/payrollSummary` route generates a payroll summary for the specified employee.

## Known limitations / in-progress
- The controller currently does not have any known limitations or in-progress features that are not documented here.
