```md
# Standup.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
The Standup.controller handles CRUD operations for standup data. It includes endpoints for listing, fetching today's entries, and creating new entries. This controller is integrated into the application's routing, allowing users to interact with standup data through various API routes.

## Where it lives in the UI
N/A

## Key flows
1. **List Standups**: Users can list all standup entries by providing a date range in the query parameters. This route is useful for fetching historical standup data.
2. **Today Standups**: Users can retrieve today's standup entries directly. This route is simpler and more accessible for quick reference.
3. **Create Standup Entry**: Users can create new standup entries by submitting a JSON payload through the API. This route is crucial for capturing new standup data.

## Known limitations / in-progress
None currently known.
