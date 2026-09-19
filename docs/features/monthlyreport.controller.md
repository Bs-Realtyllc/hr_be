# MonthlyReport.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller provides APIs for managing monthly reports, allowing users to list, submit, download, and remove reports.

## Where it lives in the UI
N/A — The APIs exposed by this controller are used by other frontend or backend components to interact with the monthly report data.

## Key flows
1. **List Monthly Reports**: Users can fetch a list of monthly reports based on specific parameters such as month, year, and date range.
2. **Submit Monthly Report**: Users can create and upload a monthly report. The API handles validation and creates a new report record.
3. **Download Monthly Report**: Users can download a specific monthly report. The API fetches the report and serves it to the user.
4. **Remove Monthly Report**: Users can delete a specific monthly report. The API deletes the report record and ensures the file is removed from storage.

## Known limitations / in-progress
- The API does not provide a direct route for users to view a monthly report's details or upload a report. These functionalities are handled elsewhere in the application.
- The API does not handle file uploads securely. The provided `req.file` object is expected to contain only the file information. Users are responsible for ensuring file integrity and security when using this API.
- The API assumes that the `monthlyReportService` is correctly configured and that the `monthlyReportDto` and `asyncHandler` middleware are properly integrated.
