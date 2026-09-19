# CultureEvent.controller

**Status:** released (~100%)

**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
The `CultureEvent.controller` handles CRUD operations for culture events. It includes functions for fetching upcoming events, listing all events, and creating new events.

## Where it lives in the UI
- Backend API route: `/api/cultureEvents/upcoming`
- Backend API route: `/api/cultureEvents/list`
- Backend API route: `/api/cultureEvents/create`

## Key flows
1. **Fetch Upcoming Events:** Navigate to `/api/cultureEvents/upcoming` to get a list of upcoming culture events.
2. **List All Events:** Navigate to `/api/cultureEvents/list` to get a list of all culture events.
3. **Create New Event:** Navigate to `/api/cultureEvents/create` and provide the necessary event details to create a new culture event.

## Known limitations / in-progress
- Ensure all required fields are provided when creating a new event.
- Handle errors appropriately in the API responses.
- Consider implementing rate limiting or authentication for sensitive operations.
