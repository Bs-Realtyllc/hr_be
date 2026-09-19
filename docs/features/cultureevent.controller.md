# CultureEvent.controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller handles CRUD operations for upcoming and list events. It provides an endpoint to fetch upcoming events and another for listing all events. Additionally, it allows for creating new events with an optional user ID.

## Where it lives in the UI
N/A — consumed by frontend components and APIs.

## Key flows
1. Fetch upcoming events: Navigate to a route that calls `upcoming` endpoint.
2. List all events: Navigate to a route that calls `list` endpoint.
3. Create an event: Navigate to a form that submits data to the `create` endpoint with optional user ID.

## Known limitations / in-progress
- The `create` endpoint does not handle validation or error responses, leading to potential issues if the input is invalid.
- The `create` endpoint assumes the user ID is always available, which might be a limitation depending on the use case.
