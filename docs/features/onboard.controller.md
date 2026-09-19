# Onboard Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller handles the creation, modification, and deletion of employee onboarding profiles. It includes functions to add employee data, approve users, and remove them from the onboarding process. Additionally, it provides a function to retrieve specific contract files.

## Where it lives in the UI
- Backend API routes: `/api/onboard/list`, `/api/onboard/add`, `/api/onboard/approve/:id`, `/api/onboard/remove/:id`, `/api/onboard/getContract/:id/:type`

## Key flows
1. **Add Employee Data**: Users can add new employee data through the `/api/onboard/add` endpoint. They must upload required files like contract, citizenshipFront, citizenshipBack, panCard, passoutCertificate, and passportPhoto.
2. **Approve and Remove Users**: Users can approve or remove employees from the onboarding process through the `/api/onboard/approve/:id` and `/api/onboard/remove/:id` endpoints, respectively.
3. **Retrieve Contract Files**: Users can request specific contract files such as passport photos, citizenship documents, NDAs, or certificates using the `/api/onboard/getContract/:id/:type` endpoint.

## Known limitations / in-progress
- Ensure that all required files are uploaded during the add operation. If any required file is missing, the operation will fail and should be handled gracefully.
- Handle potential errors in the database operations and ensure that all files are deleted in case of a failure to save the data.
- Implement error handling for file paths and ensure they are correctly resolved and managed.
