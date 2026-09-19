# Feedback Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
The `/feedback` endpoint allows authenticated users to list and create feedback entries. Users can also remove their own feedback entries.

## Where it lives in the UI
N/A — the endpoint is exposed via Express routes that are consumed by the application.

## Key flows
1. List feedback entries: Navigate to `/feedback` and query `type` and `scope` to filter the feedback entries. The entries are listed in the response.
2. Create a new feedback entry: Navigate to the feedback creation screen and submit the feedback message. The endpoint `/feedback` with `POST` method is called with the feedback message and user ID as the payload. The response will include a newly created feedback entry's ID.
3. Remove a feedback entry: Navigate to the feedback removal screen and select the feedback entry ID to be removed. The endpoint `/feedback` with `DELETE` method is called with the feedback entry ID and user ID as the payload. The response will confirm the success of the removal.

## Known limitations / in-progress
The service implementation and its interaction with the database are not documented, so any specific details regarding database queries, tables, or columns are unclear. The service's business logic for handling feedback creation and removal is also not documented, leaving the reasoning behind these operations vague.
