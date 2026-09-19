# Meeting Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This feature provides CRUD operations for meeting data, allowing users to list, create, and remove meetings.

## Where it lives in the UI
N/A

## Key flows
1. **List Meetings:** Navigate to the meeting list route to view all meetings.
2. **Create Meeting:** Navigate to the meeting creation route to add a new meeting. The request body should include the necessary fields for the meeting.
3. **Remove Meeting:** Use the API endpoint to delete a specific meeting by its ID.

## Known limitations / in-progress
- Currently, the feature does not provide a dedicated screen for managing meetings. Users interact with the data through API routes.
- The implementation of error handling and security features is ongoing.
