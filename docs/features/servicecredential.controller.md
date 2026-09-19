# ServiceCredential.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller provides endpoints for managing service credentials associated with employees. It includes a GET endpoint to retrieve service credentials by employee ID and a POST endpoint to save service credentials. The controller interacts with a serviceCredentialService for executing the required operations.

## Where it lives in the UI
N/A — accessed via backend API routes.

## Key flows
1. Retrieve service credentials for an employee: Navigate to a backend API endpoint and send a GET request with the employee ID as a parameter.
2. Save a service credential for an employee: Navigate to a backend API endpoint and send a POST request with the employee ID and the service credential data as JSON payload.

## Known limitations / in-progress
- None.
