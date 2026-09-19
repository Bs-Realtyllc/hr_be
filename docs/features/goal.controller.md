# Goal.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
Handles CRUD operations for goals, including listing, creating, updating, and removing them. The service also provides summary data.

## Where it lives in the UI
N/A — accessed via backend routes.

## Key flows
1. **List Goals**: Navigate to the `/goals` API endpoint to retrieve a list of goals.
2. **Create Goal**: Use the `/goals` API endpoint with the `create` method to create a new goal. Requires user authentication.
3. **Update Goal**: Use the `/goals/:id` API endpoint with the `update` method to update an existing goal. Requires user authentication and admin or lead role for privileged users.
4. **Update Goal Progress**: Use the `/goals/:id/progress` API endpoint with the `updateProgress` method to update the progress of a goal. Requires user authentication and admin or lead role for privileged users.
5. **Remove Goal**: Use the `/goals/:id` API endpoint with the `remove` method to remove an existing goal. Requires user authentication and admin or lead role for privileged users.

## Known limitations / in-progress
- The `create` method checks if the `employee_id` in the request body matches the user's ID. If it does not match, it throws a `403 Forbidden` error.
- The `updateProgress` method is only available for admin or lead users.
