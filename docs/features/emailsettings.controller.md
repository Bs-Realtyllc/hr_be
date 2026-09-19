# Email Settings

**Status:** released (~100% complete)

## What it does
Provides CRUD (Create, Read, Update, Delete) operations for email settings associated with an employee.

## Where it lives in the UI
Backend API route.

## Key flows
1. **GET /email-settings/:employeeId**: Fetches the email settings for a specific employee.
2. **POST /email-settings/:employeeId**: Saves the updated email settings for a specific employee, requiring the employee ID and the settings to be updated.

## Known limitations / in-progress
- Ensure all required parameters are validated.
- Handle potential errors gracefully (e.g., missing parameters, invalid input).
