# Server Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for server records. It interacts with the server service to create, read, update, and delete server entries.

## Where it lives in the UI
N/A — the server controller does not expose any UI elements. It is primarily used for backend operations within the application.

## Key flows
1. **List all servers**: Lists all server records based on the `project_id` and `show_sensitive` parameters from the query.
2. **Create a new server**: Creates a new server entry using the provided input data and the current user's ID.
3. **Update an existing server**: Updates an existing server entry using the provided input data and the current user's ID.
4. **Remove a server**: Deletes a server entry using the provided ID and the current user's ID.

## Known limitations / in-progress
- Ensure that input validation is robust to prevent security vulnerabilities.
- Implement pagination for the list operation if more than a limited number of entries need to be displayed.
- Add error handling for all operations to provide better user feedback.
