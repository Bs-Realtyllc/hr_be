# MonthlyReport.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for monthly reports, including listing, submitting, downloading, and removing reports.

## Where it lives in the UI
- Backend API routes: `list`, `submit`, `download`, and `remove`.

## Key flows
1. **List Reports**: Users can list monthly reports by providing `month`, `year`, `fromYear`, `fromMonth`, `toYear`, and `toMonth` query parameters.
2. **Submit Report**: Users can submit a new report by providing the necessary data via the API. The file uploaded with the request is used to create the report.
3. **Download Report**: Users can download a report by providing the `id` parameter.
4. **Remove Report**: Users can remove a report by providing the `id` parameter.

## Known limitations / in-progress
- The `submit` method currently only allows submission of files. Future enhancements may include handling other types of data inputs.
- The `remove` method does not validate the user's permissions; a more robust permission system could be implemented.
- The `download` method assumes the report file exists and handles it appropriately. If the file is missing, it should be handled with a proper error message or redirect.
