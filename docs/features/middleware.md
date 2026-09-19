# Middleware

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This feature provides several middleware functions for handling asynchronous operations, authentication, error handling, rate limiting, and file uploads in an Express application.

## Where it lives in the UI
N/A

## Key flows
1. **Handling asynchronous operations**: Middleware functions like `asyncHandler` are used to wrap asynchronous operations in Express routes, ensuring they handle errors and return appropriate responses.
2. **Authentication**: Middleware functions like `authenticate` check for valid JWT tokens and extract the authenticated user's role information.
3. **Role-based access control**: Middleware function `requireRole` ensures that only users with the correct role can access certain routes.
4. **Error handling**: Middleware function `errorHandler` catches errors and returns appropriate error responses, with some errors handled by their specific codes.
5. **Rate limiting**: Middleware function `authLimiter` limits the number of requests per user within a specified window.
6. **File uploads**: Middleware function `upload` manages file uploads, ensuring files are stored in the correct directory and only allowing certain file types.

## Known limitations / in-progress
- No known limitations at this time.
