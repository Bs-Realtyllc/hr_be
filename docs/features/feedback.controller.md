```md
# Feedback.Controller

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This controller handles CRUD operations for feedback data. It allows users to list, summarize, create, and remove feedback records.

## Where it lives in the UI
N/A — The feedback data is accessed through backend APIs.

## Key flows
1. **List Feedback**: Lists feedback records based on type and scope. The list can be filtered by employee ID.
2. **Summary Feedback**: Provides a summary of all feedback records.
3. **Create Feedback**: Creates a new feedback record. The message must be provided, and the employee cannot send feedback to themselves.
4. **Remove Feedback**: Deletes a feedback record based on the provided ID.

## Known limitations / in-progress
- Ensure the message is provided and not empty.
- Prevent users from sending feedback to themselves.
- Validate employee IDs.
```
