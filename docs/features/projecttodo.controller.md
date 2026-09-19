# ProjectTodo.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles CRUD operations for project todos. It provides endpoints for listing, creating, updating, toggling the completion status, and fetching progress summary for a project.

## Where it lives in the UI
Backend API routes.

## Key flows
1. **List Todos**: Navigate to the project page and access the `list` endpoint to fetch all todos within the project.
2. **Create Todo**: On the project page, use the `create` endpoint to add a new todo, requiring a `title`, `description`, `deadline`, and `sort_order`.
3. **Update Todo**: Use the `update` endpoint to modify a specific todo's attributes like `title`, `description`, `deadline`, and `sort_order`.
4. **Toggle Complete**: In the project page, toggle the `is_complete` field to mark or unmark a todo as complete using the `toggle` endpoint.
5. **Remove Todo**: Access the `remove` endpoint to delete a specific todo from the project.
6. **Fetch Progress Summary**: Utilize the `summary` endpoint to retrieve progress summary data for a project.

## Known limitations / in-progress
- Ensure all required fields are provided for `create` and `update` operations to avoid validation errors.
- Handle edge cases and boundary conditions, such as validating user permissions and ensuring that all provided attributes are valid before updating or creating.
