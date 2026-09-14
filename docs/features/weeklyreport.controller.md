```md
# WeeklyReport.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This controller handles CRUD operations for weekly reports. It includes endpoints for listing, submitting, downloading, and removing weekly reports.

## Where it lives in the UI
- Backend API route: `GET /api/weeklyReport/list`
- Backend API route: `POST /api/weeklyReport/submit`
- Backend API route: `GET /api/weeklyReport/download/:id`
- Backend API route: `DELETE /api/weeklyReport/remove/:id`

## Known limitations / in-progress
- The file upload handling is currently hardcoded to rename the uploaded file to a timestamped version. Consider using a more robust file management system.

---

```
