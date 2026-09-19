# ProjectTodo.Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller handles CRUD operations for project todos. It includes methods to list todos, create a new todo, update an existing todo, toggle its completion status, and get progress summary.

## Where it lives in the UI
Backend API route.

## Key flows
1. **List Todos**: Navigate to the project todo list page to view all todos within a specific project.
2. **Create Todo**: Access the project todo creation form to add a new todo. Required fields are title, description, deadline, and sort order.
3. **Update Todo**: Edit an existing todo using the provided edit form. Changes include updating title, description, deadline, and sort order.
4. **Toggle Completion**: Change the completion status of a todo by specifying is_complete.
5. **Remove Todo**: Delete a todo by its ID.
6. **Get Progress Summary**: Retrieve progress summary for a specific project using the project ID.

## Known limitations / in-progress
- Ensure all required fields are provided for creating and updating todos.
- Handle edge cases where parameters might be undefined or null.
