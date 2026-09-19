# FormLayout

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller provides CRUD operations for form layouts, including getting a form layout by name, setting a form layout, uploading a contract template, downloading a contract template, and deleting a contract template.

## Where it lives in the UI
- Backend API routes: GET `/formLayout`, POST `/formLayout`, POST `/uploadContractTemplate`, GET `/downloadContractTemplate`, and DELETE `/deleteContractTemplate`.

## Key flows
1. **Get a form layout by name**: 
   - Query parameter `type` is used to specify the name of the form layout.
   - The response will contain the data associated with the specified form layout name.

2. **Set a form layout**: 
   - The request body should include the name and data of the form layout.
   - The response will indicate a success message upon successful creation.

3. **Upload a contract template**: 
   - The request body should include the name and the original file details.
   - The response will confirm the successful saving of the contract template.

4. **Download a contract template**: 
   - The request parameter `type` specifies the name of the contract template.
   - The response will provide the file path and original name of the contract template for downloading.

5. **Delete a contract template**: 
   - The request parameter `type` specifies the name of the contract template.
   - The response will confirm the successful removal of the contract template.

## Known limitations / in-progress
- Ensure that all required parameters are provided for each operation.
- Handle potential errors gracefully, such as checking for the existence of a file before uploading a contract template.
