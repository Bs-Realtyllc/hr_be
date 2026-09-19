# Performance.Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for performance-related data, including listing, trending, creating, updating, submitting, acknowledging, and removing performance records.

## Where it lives in the UI
- Backend API routes: `list`, `trend`, `create`, `update`, `submit`, `acknowledge`, and `remove`.

## Key flows
1. **List**: Retrieve a list of performance records for a given employee based on the provided `employee_id` and `status`.
2. **Trend**: Generate a trend of performance records for a specific employee.
3. **Create**: Create a new performance record for a specified employee by the admin or lead.
4. **Update**: Update an existing performance record by the admin or lead.
5. **Submit**: Submit a performance record for review.
6. **Acknowledge**: Acknowledge a submitted performance record with comments.
7. **Remove**: Remove a performance record.

## Known limitations / in-progress
- None.
