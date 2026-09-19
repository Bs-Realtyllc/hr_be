# Policy Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This API controller handles CRUD operations for policies, including listing, uploading, deleting, and setting pin status.

## Where it lives in the UI
- Backend API routes: `listPolicies`, `uploadPolicy`, `deletePolicy`, `setPinned`.

## Known limitations / in-progress
- No screens or frontend components are directly tied to these API routes.

## Screens/Endpoints Consuming the API
- Frontend applications use these API routes to interact with the backend for policy management.
- Backend services (such as the main application front-end or third-party systems) use these routes to fetch, upload, delete, and update policy information.
