# Overtime Controller

**Status:** released (~100%)

**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This API controller handles various operations related to employee overtime requests, including listing, creating, approving, rejecting, updating, and canceling overtime entries.

## Where it lives in the UI
N/A — This API is consumed by other parts of the system, such as other controllers, services, or external systems, but it does not have a direct screen for users to interact with.

## Key flows
1. **List Overtime Entries**: Users can list all overtime entries by specifying `employee_id` and `status` parameters in the query.
2. **Create Overtime Entry**: Users can create a new overtime entry by providing the necessary details in the request body.
3. **Approve Overtime Entry**: Users can approve an existing overtime entry by providing the `id` of the entry and specifying the user who is approving.
4. **Reject Overtime Entry**: Users can reject an existing overtime entry by providing the `id` of the entry and specifying the user who is rejecting.
5. **Update Overtime Entry**: Users can update an existing overtime entry by providing the `id` of the entry and the necessary changes in the request body.
6. **Cancel Overtime Entry**: Users can cancel an existing overtime entry by providing the `id` of the entry and specifying the user who is canceling.

## Known limitations / in-progress
- The controller is fully implemented and ready for use.
- No known limitations or in-progress items for this feature.
