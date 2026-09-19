# Meeting Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for meetings. It allows users to list existing meetings, create a new meeting by providing a meeting input, and remove a meeting by its ID.

## Where it lives in the UI
This controller is exposed through a backend API route. Users interact with it via HTTP requests to `/api/meetings` for listing, `/api/meetings` for creating, and `/api/meetings/:id` for removing a specific meeting.

## Known limitations / in-progress
- The controller is fully implemented and ready for use.
- No related screens or UI elements are part of this controller as it operates exclusively at the API level.
