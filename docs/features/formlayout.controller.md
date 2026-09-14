```md
# Form Layout

**Status:** released (~100% complete, if known)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This feature provides API endpoints for managing form layouts, including getting, setting, uploading, downloading, and deleting contract templates.

## Where it lives in the UI
N/A

## Key flows
1. **Get Form Layout**: Navigate to the form layout controller and query for a specific form layout using the `type` query parameter.
2. **Set Form Layout**: Send a POST request with form data to set a new form layout. The form data should include the form name and the layout data.
3. **Upload Contract Template**: Send a POST request to upload a contract template file. The file should be sent as part of the request body. The template file will be saved with a unique name and path.
4. **Download Contract Template**: Navigate to the form layout controller and query for a specific contract template using the `type` query parameter. The template will be downloaded from the specified path.
5. **Delete Contract Template**: Send a DELETE request with a query parameter specifying the type of contract template to be removed. The template will be removed from the system.

## Known limitations / in-progress
- Currently, the feature does not expose a screen or route for managing form layouts. All interactions are done via API endpoints.
- The feature is fully developed and ready for use.
```
