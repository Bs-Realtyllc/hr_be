# Standup Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This feature provides CRUD operations for standup records, allowing users to list, create, and retrieve individual standup entries based on various query parameters.

## Where it lives in the UI
N/A — The standup records are accessed through backend APIs rather than a direct UI screen.

## Key flows
1. **List Standups**: List all standup records for a given date and employee, filtering by start and end date.
2. **Today Standup**: Retrieve all standup records for the current day.
3. **Create Standup**: Create a new standup record by providing the necessary details.

## Known limitations / in-progress
- The frontend does not display any UI for managing standup records. Users interact with standup records via backend API endpoints.
- The service implementation is based on `standupService`, which handles the database interactions for standup records.
- The DTO (`standupDto`) used for creating and retrieving standup records ensures that the API responses are consistent with the expected data structure.
- The middleware `asyncHandler` is used to handle asynchronous operations in the controller.
