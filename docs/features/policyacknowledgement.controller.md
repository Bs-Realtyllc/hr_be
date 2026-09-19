# PolicyAcknowledgement.controller

**Status:** released (~100%)

**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles submission and retrieval of policy acknowledgements, allowing users to submit their acknowledgments and view submissions made by employees.

## Where it lives in the UI
- Backend API routes for submitting acknowledgements, retrieving submissions, and reviewing submissions.

## Key flows
1. A user submits a policy acknowledgment using the `submitAcknowledgement` endpoint.
2. An employee retrieves their own submissions using the `myAcknowledgements` endpoint.
3. An employee admin retrieves submissions made by other employees using the `listForEmployeeAdmin` endpoint.
4. An employee admin reviews a submission using the `reviewSubmission` endpoint.

## Known limitations / in-progress
- No specific known limitations or in-progress items are listed for this feature.
