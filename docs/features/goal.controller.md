```md
# Goal.Controller

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This module handles CRUD operations for goals, including listing, creating, updating, and removing them. It also provides summary data and progress updates.

## Where it lives in the UI
N/A — the operations are backend-only and do not expose a screen or API endpoint directly.

## Key flows
1. **List Goals:** Navigate to the list route to view a paginated list of goals.
2. **Create Goal:** Navigate to the create route to add a new goal. Requires a valid employee ID and input data.
3. **Update Goal:** Navigate to the update route to modify an existing goal. Requires the goal ID and input data.
4. **Update Progress:** Navigate to the progress update route to update the progress of an existing goal. Requires the goal ID and input data.
5. **Remove Goal:** Navigate to the remove route to delete an existing goal. Requires the goal ID.

## Known limitations / in-progress
- The module does not expose a frontend or backend UI for goal management. All interactions are done through API routes.
- The API routes are protected by authentication, ensuring only authenticated users can perform goal-related operations.
- The `employee_id` field is used to identify the employee who owns the goal. If the `employee_id` provided does not match the authenticated user, an error is thrown.
- The `remove` route does not provide a success response as it is a destructive operation and no response is sent upon successful deletion.
```
