```md
# Onboard Controller

**Status:** released (~100% complete) (~2026-09-14)

## What it does
This controller handles the CRUD operations for employee_onboarding_profile, including adding, approving, removing, and retrieving individual contracts and documents.

## Where it lives in the UI
N/A — the controller interacts with backend services but does not expose any screens or routes for users to interact with.

## Key flows
1. **Add Data**: Users can add new employee data by uploading required documents and providing additional information.
2. **Approve User**: A manager can approve an employee's data, moving it to the employees table.
3. **Remove User**: A manager can remove an employee's data.
4. **Get Contract**: Users can request to download a specific contract or document.

## Known limitations / in-progress
- The controller currently only supports basic CRUD operations and does not handle complex business logic or integrations with other systems.
- The files uploaded by users are saved locally on the server and are not securely stored or managed outside of this controller. Ensure that all uploaded files are appropriately secured and do not contain sensitive information.
- The controller does not include any UI components or API routes that a user interacts with directly. It is solely for backend processing and storage.
```
