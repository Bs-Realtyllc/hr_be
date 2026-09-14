```md
# Project Controller

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
The project controller manages project-related operations, including listing, creating, updating, and removing projects, as well as handling assignments, milestones, and services.

## Where it lives in the UI
- Backend API routes for project operations (e.g., `/api/projects`, `/api/projects/{id}`, `/api/projects/{id}/assignments`, etc.).

## Key flows
1. **List Projects:** Fetches a list of projects based on optional status filters.
2. **Create Project:** Creates a new project using the provided input data.
3. **Update Project:** Updates an existing project with the provided input data.
4. **Remove Project:** Deletes an existing project.
5. **Get Assignments:** Fetches a list of assignments for a specific project.
6. **Add Assignment:** Adds a new assignment to a project.
7. **Remove Assignment:** Removes a specific assignment from a project.
8. **Get Milestones:** Fetches a list of milestones for a specific project.
9. **Add Milestone:** Adds a new milestone to a project.
10. **Update Milestone:** Updates an existing milestone in a project.
11. **Get Services:** Fetches a list of services associated with a project.
12. **Add Service:** Adds a service to a project.
13. **Remove Service:** Removes a service from a project.
14. **By Employee:** Fetches a list of projects associated with a specific employee.

## Known limitations / in-progress
- None.
```
