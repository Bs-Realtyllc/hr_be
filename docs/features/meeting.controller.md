```md
# Meeting Controller

**Status:** released (~100% complete) (~100% complete, if known)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
Manages meetings by providing CRUD operations on meetings data.

## Where it lives in the UI
Backend API route. The feature is accessed via API calls, not through a
specific screen.

## Key flows
1. **List Meetings**: Fetches all meetings from the database.
2. **Create Meeting**: Creates a new meeting entry.
3. **Remove Meeting**: Deletes a meeting entry.

## Known limitations / in-progress
- The service implementation is not exposed for inspection, so the exact
  implementation details are unclear. The service interacts with the database
  and user authentication system.
- Documentation for the service methods (e.g., `list`, `create`, `remove`)
  is not available, so their exact behavior and arguments are not clear.
```
