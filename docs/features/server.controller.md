# Server.controller

**Status:** released (~100% complete)

## What it does
This module handles CRUD operations for server-related data. It includes endpoints for listing, creating, updating, and deleting server entries.

## Where it lives in the UI
N/A

## Key flows
1. **List servers:** Navigate to the list page for servers to view all entries.
2. **Create server:** Submit a request to create a new server entry.
3. **Update server:** Modify an existing server entry by submitting a request with updated data.
4. **Remove server:** Remove an existing server entry by submitting a request with the server ID.

## Known limitations / in-progress
- The service function names are derived from TypeScript DTOs, hence the specific method names and input/output structures. Ensure DTOs and service functions are correctly implemented and updated.
