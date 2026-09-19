# Policy Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for policies, including listing, uploading, deleting, and pinning policies.

## Where it lives in the UI
N/A — These operations are backend APIs that users do not directly interact with.

## Known limitations / in-progress
- The `uploadPolicy` method uses `policyDto.toUploadInput` to handle the input data, which may not be documented elsewhere.
- The `setPinned` method uses a boolean value in `req.body` to determine if a policy should be pinned, which is not explicitly documented in the DTOs.
