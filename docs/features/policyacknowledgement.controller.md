```md
# PolicyAcknowledgement.Controller

**Status:** released (~100% complete)

## What it does
The controller handles submission and retrieval of policy acknowledgements for employees.

## Where it lives in the UI
- Backend API routes for submitting acknowledgements and retrieving acknowledgements.

## Key flows
1. **Submit Acknowledgement**: A user uploads a file (e.g., PDF) and submits the policy ID and user ID. The controller calls the service to save the submission.
2. **My Acknowledgements**: An employee retrieves their acknowledged policies by their user ID.
3. **List For Employee Admin**: An employee admin retrieves a list of acknowledged policies for a specific user ID.
4. **List Submissions**: A system administrator retrieves a list of all acknowledged policies for a specific user ID.
5. **Review Submission**: An employee admin can review and reject a submission by providing the submission ID and rejection reasons.

## Known limitations / in-progress
- The controller currently does not handle file uploads directly. Instead, it relies on the frontend to upload the file, which is then passed to the controller via the request object.
- The service layer for handling policy acknowledgements is not defined in the provided code. This is a placeholder for where the actual service implementation would be defined and integrated.
```
