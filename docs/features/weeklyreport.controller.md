# WeeklyReport.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller manages weekly reports, providing functionalities to list, submit, download, and remove them. It handles file uploads and storage.

## Where it lives in the UI
- Backend API route: `submit`, `download`, `remove`
- Shared context for file handling: `list`, `submit`

## Key flows
1. List weekly reports: Navigate to the list endpoint.
2. Submit a new weekly report: Upload a file and submit the details.
3. Download a weekly report: Access the report using its ID.
4. Remove a weekly report: Delete the report using its ID.

## Known limitations / in-progress
- The controller manages file uploads and storage. Ensure the upload path and file name are correctly handled to avoid any corruption.
- The controller does not list any screens or routes for the user interface. It only exposes API endpoints for interacting with the underlying service.
- Ensure that the file handling is robust and can handle errors gracefully.
