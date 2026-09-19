# Holiday Controller

**Status:** released (~100%)

**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for holidays. It provides endpoints to list holidays, create a new holiday, and remove an existing holiday.

## Where it lives in the UI
- Backend API route: `POST /api/holidays` for creating holidays
- Backend API route: `GET /api/holidays?year=yyyy` for listing holidays
- Backend API route: `DELETE /api/holidays/:id` for removing holidays

## Key flows
1. **Create a new holiday:**
   1. User sends a POST request to `/api/holidays` with holiday data.
   2. Server validates the input and calls the `create` method of the `holidayService`.
   3. If successful, returns a 201 Created response with the holiday ID.

2. **List holidays:**
   1. User sends a GET request to `/api/holidays?year=yyyy` with the year parameter.
   2. Server retrieves holiday data for the specified year and calls the `list` method of the `holidayService`.
   3. Server formats and returns the holiday list in JSON format.

3. **Remove a holiday:**
   1. User sends a DELETE request to `/api/holidays/:id`.
   2. Server calls the `remove` method of the `holidayService` with the provided holiday ID.
   3. Server responds with a success status.

## Known limitations / in-progress
- Ensure all required fields are provided for creating a holiday.
- Handle any potential errors gracefully, such as invalid input or missing data.
