# WeeklyReport.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller handles CRUD operations for weekly reports. It includes functions for listing, submitting, downloading, and removing weekly reports.

## Where it lives in the UI
N/A — accessed via API routes.

## Key flows
1. **List**: Navigate to the API route `/api/weeklyReport/list` to retrieve a list of weekly reports based on the provided `week_start_date` and `year` query parameters.
2. **Submit**: Upload a file and call the API route `/api/weeklyReport/submit` with the file data and user information. The file is stored in a secure location and associated with the weekly report.
3. **Download**: Fetch a weekly report using its ID and user information, then call the API route `/api/weeklyReport/download` to download the file located at the provided path.
4. **Remove**: Delete a weekly report by its ID and user information via the API route `/api/weeklyReport/remove`.

## Known limitations / in-progress
- The file upload functionality currently checks for the presence of a file before proceeding. Ensure files are correctly uploaded to avoid errors.
- The controller service functions `list`, `submit`, `download`, and `remove` are not detailed and assume proper implementation in their respective service files.
- The file handling logic includes renaming and storing the file, and removing the file if an error occurs during any of these steps.
- The controller service is expected to handle the logic for fetching and removing weekly reports, as well as creating and updating the file path and name in the database.
