```md
# CultureEvent Controller

**Status:** released (~100% complete) (~2026-09-14)

## What it does
This controller handles CRUD operations for upcoming and listed culture events. It includes endpoints for listing upcoming events, listing all events, and creating new events.

## Where it lives in the UI
- Backend API route: `/culture-event/upcoming` (GET)
- Backend API route: `/culture-event/list` (GET)
- Backend API route: `/culture-event` (POST)

## Known limitations / in-progress
- No user interface screens are directly consuming these routes.
- The logic for creating events is handled through the service layer, and no frontend integration is required.
```
