```md
# Policy.controller

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This controller handles CRUD operations for policies. It includes methods to list policies, upload and delete policies, and set policy pins.

## Where it lives in the UI
Backend API route: 
- `listPolicies` for fetching policies.
- `uploadPolicy` for uploading policy files.
- `deletePolicy` for removing policy files.
- `setPinned` for setting policy pins.

## Known limitations / in-progress
- The `uploadPolicy` method uses the file's original name without a file path, assuming the file is stored in a directory named 'uploads/policies'. This could lead to confusion if the file is renamed or moved.
- The `deletePolicy` method uses a file path to delete the policy, which may not work correctly if the policy file is stored in a different directory.
```
