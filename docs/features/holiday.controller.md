```md
# Holiday Controller

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
Manages holidays by providing a way to list holidays for a given year, create new holidays, and remove existing ones.

## Where it lives in the UI
- Backend API route: POST /api/holidays/create and GET /api/holidays/list

## Key flows
1. **List Holidays**: N/A
2. **Create Holiday**: Sends a POST request to `/api/holidays/create` with the holiday details.
3. **Remove Holiday**: Sends a DELETE request to `/api/holidays/{id}` to remove a holiday.

## Known limitations / in-progress
- The holiday creation and removal are currently only available through backend APIs and do not have a corresponding frontend screen or API route for user interaction.
- Ensure that all necessary holidays are created and removed according to business rules.
- Authentication is handled through the `req.user` object, requiring a valid JWT token.
```
