# Dashboard Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller exports several asynchronous functions to retrieve statistical data and trends related to standup meetings and leave requests from the dashboard service.

## Where it lives in the UI
- Backend API route: GET `/api/dashboard/getStats`
- Backend API route: GET `/api/dashboard/standupTrend`
- Backend API route: GET `/api/dashboard/leaveTrend`

## Known limitations / in-progress
- No user-facing screens or routes related to this controller. This controller provides backend support for retrieving data used by other parts of the system.
