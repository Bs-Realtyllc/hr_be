# Email Settings

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
Access to employee-specific email settings, allowing management to configure email notifications for them.

## Where it lives in the UI
- Backend API route: GET `/api/emailSettings/:employeeId`
- Backend API route: POST `/api/emailSettings/:employeeId`

## Known limitations / in-progress
- The API route for fetching email settings is not currently documented elsewhere in the API documentation.
- The API route for saving email settings may have additional parameters or validation rules that are not specified in the current code.
