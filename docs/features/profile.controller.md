# Profile Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for user profiles, including getting, updating, and uploading profile information and documents.

## Where it lives in the UI
- Backend API route: GET `/api/profile`
- Backend API route: PUT `/api/profile`
- Backend API route: POST `/api/profile/upload-photo`
- Backend API route: POST `/api/profile/upload-citizenship/[front|back]`

## Key flows
1. **Get Profile**: A user navigates to `/api/profile` to retrieve their profile information.
2. **Update Profile**: A user updates their profile using the PUT `/api/profile` endpoint.
3. **Upload Profile Photo**: A user uploads their profile photo using the POST `/api/profile/upload-photo` endpoint.
4. **Upload Citizenship Document**: A user uploads a document related to their citizenship using the POST `/api/profile/upload-citizenship/[front|back]` endpoint.

## Known limitations / in-progress
- The controller currently does not handle errors gracefully, and there are no error handlers defined. It will throw an error if a required field is missing or if a file is not uploaded.
- The controller does not validate the side parameter for the citizenship document upload. It will throw an error if an invalid side is provided.
- The controller does not delete any files if the upload fails. This functionality should be implemented to ensure that no corrupt files are left in the system.
