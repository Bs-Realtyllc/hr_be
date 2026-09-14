```md
# Profile Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This API allows users to get their profile information, update their profile, and upload their photo and citizenship documents.

## Where it lives in the UI
- Backend API route: GET `/profile`
- Backend API route: PATCH `/profile`
- Backend API route: POST `/profile/photo`
- Backend API route: POST `/profile/citizenship`

## Key flows
1. **Get Profile**: A user navigates to the `/profile` endpoint to retrieve their profile information.
2. **Update Profile**: A user navigates to the `/profile` endpoint and sends a PATCH request with their updated profile information.
3. **Upload Photo**: A user uploads their photo at the `/profile/photo` endpoint.
4. **Upload Citizenship**: A user uploads their citizenship document at the `/profile/citizenship` endpoint.

## Known limitations / in-progress
- None
```
