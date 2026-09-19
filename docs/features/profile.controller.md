# Profile Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller provides CRUD operations for user profiles. It includes functions to fetch, update, and upload profile information and documents.

## Where it lives in the UI
- Backend API route: `getProfile`, `updateProfile`, `uploadPhoto`, `uploadCitizenship`

## Key flows
1. **Fetching Profile**: A user can request to fetch their profile information by providing their ID. The API will return the user's profile data.
2. **Updating Profile**: A user can update their profile information by sending a PUT request to the `updateProfile` endpoint. The request must include the necessary updates in a DTO format and an optional DOB value.
3. **Uploading Profile Photo**: A user can upload a profile photo to their profile. The API will handle the upload and return the filename of the uploaded photo.
4. **Uploading Citizenship Document**: A user can upload either the front or back side of their citizenship document. The API will handle the upload and return the filename of the uploaded document. If the upload fails, the API will delete the file and throw an error.

## Known limitations / in-progress
- Ensure that required fields are present and valid in the request body.
- Handle any potential errors that may occur during file uploads, such as invalid filenames or missing file uploads.
- Ensure proper validation of side parameters for the `uploadCitizenship` endpoint.
- Update `profile.service.ts` and related files to include the necessary logic for fetching, updating, and uploading profile information and documents.
- Implement testing for the new endpoints to ensure they work correctly.
