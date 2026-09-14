```md
# Dashboard Controller

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
Provides APIs for fetching stats and trends related to the dashboard, including employee stats and leave trends.

## Where it lives in the UI
N/A

## Key flows
1. **Fetch Stats:** Navigate to `/api/dashboard/getStats` to get the latest dashboard statistics.
2. **Standup Trend:** Navigate to `/api/dashboard/standupTrend` to get standup trend data.
3. **Leave Trend:** Navigate to `/api/dashboard/leaveTrend` to get leave trend data.

## Known limitations / in-progress
- Ensure all necessary dependencies are properly configured in the environment for these APIs to work.
- Handle potential API errors gracefully, providing appropriate response codes and messages.
```
