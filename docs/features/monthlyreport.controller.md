```md
# Monthly Report

**Status:** released (~100% complete) (~80% complete, if known)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This controller handles CRUD operations for monthly reports, allowing users to list, submit, download, and delete reports.

## Where it lives in the UI
- Backend API route: `/api/monthlyReport/list`, `/api/monthlyReport/submit`, `/api/monthlyReport/download`, `/api/monthlyReport/remove`

## Key flows
1. **List Monthly Reports**: Navigate to `/monthlyReport/list` to view a list of reports.
2. **Submit a New Monthly Report**: Use the `/monthlyReport/submit` API to upload a report file and submit it.
3. **Download a Monthly Report**: Use the `/monthlyReport/download/:id` API to download a report based on its ID.
4. **Remove a Monthly Report**: Use the `/monthlyReport/remove/:id` API to remove a report based on its ID.

## Known limitations / in-progress
- Ensure proper validation and error handling for file uploads and report data.
- Document any additional security measures or permissions required for these operations.
- Implement logging for all API interactions related to monthly reports.
```
