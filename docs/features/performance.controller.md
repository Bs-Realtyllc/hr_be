```md
# Performance Controller

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
The performance controller provides CRUD (Create, Read, Update, Delete) operations for performance records. It handles both backend API routes and frontend interactions via the provided APIs.

## Where it lives in the UI
- Backend API routes: `GET /api/performance`, `GET /api/performance/{employeeId}`, `POST /api/performance`, `PUT /api/performance/{id}`, `PATCH /api/performance/{id}`, `DELETE /api/performance/{id}`, `POST /api/performance/trend/{employeeId}`
- Frontend: Uses the backend APIs directly

## Key flows
1. **List Performance Records**: Users can retrieve a list of performance records for a specific employee or by status.
2. **Trend Performance Records**: Users can view trends in performance records for a specific employee.
3. **Create Performance Record**: Admins can create new performance records.
4. **Update Performance Record**: Users can update existing performance records.
5. **Submit Performance Record**: Users can submit performance records to the backend.
6. **Acknowledge Performance Record**: Users can acknowledge performance records and provide feedback.
7. **Remove Performance Record**: Users can remove performance records.

## Known limitations / in-progress
- Ensure all API calls are authenticated and have proper permissions.
- Implement additional validation and error handling for API requests.
- Document all API endpoints and their expected responses.
- Ensure the controller handles pagination and sorting requests appropriately.
- Integrate with other backend services or databases as needed.
```
