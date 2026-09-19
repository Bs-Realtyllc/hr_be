# Google Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles Google authentication and sync functionalities for an application, including getting an authentication URL, handling the callback, getting the status, disconnecting from Google, and syncing data.

## Where it lives in the UI
- Backend API routes:
  - `getAuthUrl`: Consumed by frontend to get an authentication URL.
  - `handleCallback`: Consumed by frontend to handle the OAuth callback.
  - `getStatus`: Consumed by frontend to get the application's status.
  - `disconnect`: Consumed by frontend to disconnect from Google.
  - `sync`: Consumed by frontend to sync data.
  - `webhook`: Consumed by the Google server to process webhook events.

## Known limitations / in-progress
- The OAuth callback process might need to be optimized for better error handling and user experience.
- The webhook route is currently a placeholder and might need to be expanded based on Google's webhook requirements.
