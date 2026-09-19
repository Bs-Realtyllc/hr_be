# Holiday Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller handles CRUD operations for holidays, including listing, creating, and removing holiday entries.

## Where it lives in the UI
N/A

## Key flows
1. **List Holidays**: Navigate to the holiday listing page or use the holiday API to fetch holidays for a specific year.
2. **Create Holiday**: Use the holiday creation API with the appropriate payload to add a new holiday entry.
3. **Remove Holiday**: Use the holiday removal API with the holiday ID to delete a holiday entry.

## Known limitations / in-progress
- The holiday creation API payload expects certain properties to be defined, and additional validation is needed to ensure the payload is valid before creating a holiday entry.
- The holiday service's `remove` method doesn't return a success message; it only responds with `{ success: true }` when a holiday is successfully deleted.
