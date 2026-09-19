# Project Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
The `project.controller.ts` exports several API routes for managing projects and their assignments, milestones, and services.

## Where it lives in the UI
N/A

## Key flows
1. **List Projects**: Users can list projects by status using the `/projects` endpoint with query parameters.
2. **Create Project**: New projects can be created via the `/projects` endpoint.
3. **Update Project**: Projects can be updated using the `/projects/:id` endpoint.
4. **Delete Project**: Projects can be deleted via the `/projects/:id` endpoint.
5. **Get Assignments**: Get all assignments for a specific project using the `/projects/:id/assignments` endpoint.
6. **Add Assignment**: Add a new assignment to a project using the `/projects/:id/assignments` endpoint with the `id` parameter.
7. **Remove Assignment**: Remove an assignment from a project using the `/projects/:id/assignments/:empId` endpoint.
8. **Get Milestones**: Retrieve milestones for a specific project using the `/projects/:id/milestones` endpoint.
9. **Add Milestone**: Add a new milestone to a project using the `/projects/:id/milestones` endpoint with the `id` parameter.
10. **Update Milestone**: Update an existing milestone using the `/projects/:id/milestones/:mid` endpoint.
11. **Get Services**: Retrieve all services associated with a project using the `/projects/:id/services` endpoint.
12. **Add Service**: Add a service to a project using the `/projects/:id/services` endpoint with the `service_key` parameter.
13. **Remove Service**: Remove a service from a project using the `/projects/:id/services/:serviceKey` endpoint.
14. **By Employee**: List projects assigned to a specific employee using the `/projects/by-employee/:empId` endpoint.

## Known limitations / in-progress
- Ensure all API responses are properly formatted and include the expected JSON structures.
- Verify security measures, such as authentication and authorization, for all API endpoints.
- Implement logging for critical operations to aid in debugging and auditing.
- Document any third-party dependencies or services used by the API.
