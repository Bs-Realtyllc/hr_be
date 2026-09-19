# PolicyAcknowledgement Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller handles the submission and retrieval of policy acknowledgments. It provides endpoints for submitting policy acknowledgments, listing acknowledgments for a specific policy, and reviewing submitted acknowledgments.

## Where it lives in the UI
Backend API routes.

## Key flows
1. **Submit Acknowledgement:** A user uploads a file and submits a policy acknowledgment. This action is handled by the `submitAcknowledgement` endpoint.
2. **List My Acknowledgements:** A user can list their own policy acknowledgments by calling the `myAcknowledgements` endpoint.
3. **List Acknowledgements for Employee:** An employee can list acknowledgments for another employee by calling the `listForEmployeeAdmin` endpoint.
4. **List Acknowledgements for Policy:** A specific policy can have its acknowledgments listed by calling the `listSubmissions` endpoint.
5. **Review Acknowledgement:** An administrator can review a submitted acknowledgment by calling the `reviewSubmission` endpoint.

## Known limitations / in-progress
- Ensure proper validation and error handling for file uploads and submission requests.
- Implement logging for critical operations for better debugging and auditing.
- Optimize the performance of the `listSubmissions` operation for handling large datasets.
