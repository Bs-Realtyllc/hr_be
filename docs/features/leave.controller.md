# Leave Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles various leave-related operations, including listing, balancing, approving, rejecting, updating, and cancelling leave requests. It also allows creating leave requests via email.

## Where it lives in the UI
- Backend API routes: `list`, `balances`, `report`, `outToday`, `outThisWeek`, `create`, `approve`, `reject`, `update`, `cancel`, `createViaMail`.

## Known limitations / in-progress
- The `employeeRepo` is not imported, so any logic that relies on this import is not available.
- The `employee_id` query parameter and `employeeId` path parameter are used, but the `employeeRepo` is missing to handle these.
