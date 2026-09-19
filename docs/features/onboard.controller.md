# onboard.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for employee_onboarding_profile data, including listing, adding, approving, and removing records. It also provides a method to download contract documents.

## Where it lives in the UI
- Backend API route for listing employee_onboarding_profile data: `/onboard/list`
- Backend API route for adding employee_onboarding_profile data: `/onboard/add`
- Backend API route for approving an employee_onboarding_profile record: `/onboard/approve/:id`
- Backend API route for removing an employee_onboarding_profile record: `/onboard/remove/:id`
- Backend API route for downloading a contract document: `/onboard/getContract/:id/:type`

## Known limitations / in-progress
- The routes are secured based on user permissions.
- The `getContract` route requires the user to be logged in and provide the correct employee_id and contract type.
- The controller uses environment variables for file paths and filenames.
