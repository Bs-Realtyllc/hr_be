# Performance Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This feature provides APIs for managing employee performance data, including listing, trend analysis, creating, updating, submitting, acknowledging, and removing performance records.

## Where it lives in the UI
N/A

## Key flows
1. List performance records: Navigate to the performance controller and call the `list` endpoint. This will return a list of performance records based on the `employee_id` and `status` query parameters.
2. Get performance trend: Navigate to the performance controller and call the `trend` endpoint. This will provide a trend analysis of the performance records for a specific employee.
3. Create a new performance record: As an admin or lead, navigate to the performance controller and call the `create` endpoint. This will create a new performance record for the specified employee and user.
4. Update a performance record: Navigate to the performance controller and call the `update` endpoint. This will update the specified performance record with the provided input.
5. Submit a performance record: Navigate to the performance controller and call the `submit` endpoint. This will submit the specified performance record.
6. Acknowledge a performance record: Navigate to the performance controller and call the `acknowledge` endpoint. This will acknowledge the specified performance record and optionally include employee comments.

## Known limitations / in-progress
- Currently, the feature only supports admin and lead roles for creating and updating performance records. Other roles must use the `list` and `submit` endpoints.
- No frontend or UI screens are consumed by this feature; it is a backend API only.
