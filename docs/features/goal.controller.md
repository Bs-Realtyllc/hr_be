# Goal Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
Manages goals for employees. Provides endpoints for listing, creating, updating, and removing goals. Also includes endpoints for summarizing goal data and updating progress.

## Where it lives in the UI
Backend API routes.

## Key flows
1. **List Goals**: Fetches all goals associated with an employee.
2. **Create Goal**: Creates a new goal for the current user.
3. **Update Goal**: Updates an existing goal. Requires the user to have the 'admin' or 'lead' role to modify goals of other employees.
4. **Remove Goal**: Deletes a goal associated with an employee.
5. **Summary**: Fetches and returns summary data for goals.
6. **Update Progress**: Updates the progress of a specific goal.

## Known limitations / in-progress
- Ensures that the user attempting to create or update a goal has the necessary permissions.
- The goal service methods are not documented in `docs/api/descriptions.yaml`.
