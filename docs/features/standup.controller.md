# Standup Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This API controller handles CRUD operations for standups. It provides endpoints to list standups within a date range, fetch standups for today, and create new standups.

## Where it lives in the UI
- N/A

## Key flows
1. **List Standups**: Fetch standups within a given date range.
   - Query parameters: `date`, `start_date`, `end_date`
2. **Today Standups**: Fetch standups for today.
   - No query parameters
3. **Create Standup**: Create a new standup.
   - Request body: `standupDto.toCreateInput`
   - Optional: `req.user?.id` for authorization

## Known limitations / in-progress
- The `standupService` and `standupDto` modules are referenced but not defined in the provided code snippet, so their exact functionality and how they interact with the controller is not clear.
- The service and DTO classes should be defined and documented in their respective files for a comprehensive understanding of the API.
