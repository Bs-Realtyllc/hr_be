# Leave Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
The leave controller handles various leave management operations including listing, balancing, reporting, out today/out this week, creating, approving, rejecting, updating, and canceling leaves. It also supports creating leaves via email.

## Where it lives in the UI
N/A — the operations are backend APIs for a leave management system.

## Key flows
1. **List Leaves:** Lists all employee leaves based on provided parameters such as `employee_id` and `status`.
2. **Balance Leaves:** Calculates the balance of leaves for a specific employee based on their `employee_id`.
3. **Report:** Generates a report of leave balances for all employees.
4. **Out Today/This Week:** Returns a list of leaves taken on a specific day or week for a given employee.
5. **Create Leave:** Allows creating a new leave entry. The request body must contain the `to`, `cc`, and `bcc` properties.
6. **Approve Leave:** Approves a leave request identified by `id`.
7. **Reject Leave:** Rejects a leave request identified by `id`.
8. **Update Leave:** Updates an existing leave entry identified by `id`.
9. **Cancel Leave:** Cancels an existing leave entry identified by `id`.

## Known limitations / in-progress
- The `employeeRepo` import is commented out, so the actual implementation might use a different repository for fetching employee information.
- The `leaveService` service class is referenced but not imported, which should be imported to use its methods.
- The `employeeRepo` is commented out, so the actual implementation might use a different repository for fetching employee information.
- The actual service class (`leaveService`) is referenced but not imported, which should be imported to use its methods.
