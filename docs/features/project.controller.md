# Project Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller provides CRUD operations for projects and their associated assignments, milestones, and services. It supports both project-level and employee-level operations.

## Where it lives in the UI
Backend API routes. It does not expose any user-facing screens or components.

## Key flows
1. **List Projects:** Users can list all projects based on their status.
2. **Create Project:** Administrators can create a new project by providing the necessary details.
3. **Update Project:** Project administrators can update an existing project's details.
4. **Remove Project:** Project administrators can delete a project.
5. **Get Assignments:** Employees can view the list of projects they are assigned to.
6. **Add Assignment:** Employees can add their own project assignment.
7. **Remove Assignment:** Employees can remove their project assignment.
8. **Get Milestones:** Employees can view the milestones for their assigned projects.
9. **Add Milestone:** Employees can create a new milestone for their assigned projects.
10. **Update Milestone:** Employees can update the details of an existing milestone.
11. **Get Services:** Employees can view the services associated with their assigned projects.
12. **Add Service:** Employees can add a service to their assigned projects.
13. **Remove Service:** Employees can remove a service from their assigned projects.
14. **List Projects by Employee:** Employees can see the list of projects they are associated with.

## Known limitations / in-progress
- Ensure proper validation for all input parameters to prevent potential security issues.
- Implement logging for critical operations to track changes and for auditing purposes.
- Provide more detailed error messages for common input errors and exceptions.
- Optimize database queries and API responses for performance and scalability.
- Ensure proper authorization checks for all operations to prevent unauthorized access.
- Implement internationalization for displaying project statuses in multiple languages.
- Add more detailed documentation for the DTOs and the service functions.
