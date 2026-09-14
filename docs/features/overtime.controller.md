```md
# Overtime Controller

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This controller handles various operations related to employee overtime requests, including listing, creating, approving, rejecting, updating, and canceling overtime entries.

## Where it lives in the UI
- Backend API route: /overtime

## Key flows
1. List all employee overtime entries: `/overtime`
2. Create a new overtime entry: `/overtime`
3. Approve, reject, or update an existing overtime entry: `/overtime/{id}`

## Known limitations / in-progress
- No corresponding frontend or UI screen is directly exposed for this controller. It is used internally for API consumption by other systems or services.
- The controller interacts with the `overtime.service` to manage overtime entries and requires the `user` and `employee_id` parameters for authentication and identifying the employee.
- The `overtime.service` methods `list`, `create`, `approve`, `reject`, `update`, and `cancel` handle the respective operations and return the necessary responses.
```
