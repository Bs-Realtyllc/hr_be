```md
# Server Controller

**Status:** released (~100% complete) (~100% complete, if known)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This module provides CRUD (Create, Read, Update, Delete) operations for server objects. It handles both backend API routes and potentially frontend infrastructure that consumes these objects.

## Where it lives in the UI
- Backend API routes for server operations are defined under `/api/server`.
- Shared context or libraries that consume server objects may be located under `/lib/server`.

## Key flows
1. **List Servers:** Navigate to the `/api/server` endpoint to retrieve a list of all servers. This is useful for a dashboard or a settings section where users can see a summary of all server objects.
2. **Create Server:** Use the `/api/server` route with a POST request to create a new server object. The response includes a newly created server's unique ID.
3. **Update Server:** Utilize the `/api/server/:id` route with a PUT request to modify a specific server object. The response confirms the update is successful.
4. **Delete Server:** Employ the `/api/server/:id` route with a DELETE request to remove a specific server object. The response indicates the deletion is successful.

## Known limitations / in-progress
- Currently, no frontend screens or infrastructure specifically target this controller. The operations are managed entirely through backend API routes.

```
