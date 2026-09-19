# Service Credential Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for service credentials. It provides an endpoint to fetch service credentials associated with an employee and another to save new service credentials.

## Where it lives in the UI
- Backend API route: GET `/api/serviceCredentials/:employeeId`
- Backend API route: POST `/api/serviceCredentials`

## Key flows
1. **Fetch Service Credentials**: Navigate to the backend API endpoint `/api/serviceCredentials/:employeeId` to retrieve a list of service credentials for a specific employee.
2. **Save Service Credentials**: Navigate to the backend API endpoint `/api/serviceCredentials` to create a new service credential for an employee, requiring the employee's ID and the service credential data.

## Known limitations / in-progress
- Ensure that the `employeeId` and `serviceCredentialDto` input data are properly validated and sanitized before processing to prevent security vulnerabilities.
- Document the expected format for the `serviceCredentialDto` object to ensure consistency in API usage.
- Implement error handling for API responses to provide meaningful feedback to the client.
- Consider adding pagination or filtering options to the API endpoints for larger data sets.
