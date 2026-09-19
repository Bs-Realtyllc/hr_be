# Overtime.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles various operations related to employee overtime, including listing, creating, approving, rejecting, updating, and canceling overtime requests.

## Where it lives in the UI
N/A — The controller routes are consumed by frontend and backend APIs and do not directly display any screens.

## Key flows
1. **List Overtime Requests**: User navigates to the endpoint `https://<server>/api/overtime/list` to retrieve a list of all overtime requests for a specific employee, filtered by status.
2. **Create Overtime Request**: User sends a POST request to `https://<server>/api/overtime/create` with the necessary data to create a new overtime request.
3. **Approve Overtime Request**: User sends a PUT request to `https://<server>/api/overtime/approve/{id}` to approve a specific overtime request identified by its ID.
4. **Reject Overtime Request**: User sends a PUT request to `https://<server>/api/overtime/reject/{id}` to reject a specific overtime request identified by its ID.
5. **Update Overtime Request**: User sends a PUT request to `https://<server>/api/overtime/update/{id}` to update a specific overtime request identified by its ID.
6. **Cancel Overtime Request**: User sends a PUT request to `https://<server>/api/overtime/cancel/{id}` to cancel a specific overtime request identified by its ID.

## Known limitations / in-progress
- None.
