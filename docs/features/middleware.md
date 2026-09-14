```md
# Middleware

**Status:** released (~100% complete)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
Provides various middleware functions for handling asynchronous requests, authentication, rate limiting, and file uploads in an Express application.

## Where it lives in the UI
N/A

## Key flows
1. Handling asynchronous requests: Middleware like `asyncHandler` is used to handle asynchronous functions passed to it, ensuring that errors are passed to the next middleware or handler.
2. Authentication: Middleware like `authenticate` verifies JWT tokens provided in the request headers, and `requireRole` ensures that the authenticated user has the required role.
3. Error handling: Middleware like `errorHandler` catches errors that may occur during the route execution and returns appropriate error responses.
4. Rate limiting: Middleware like `authLimiter` limits the number of requests a user can make within a specified time window.
5. File uploads: Middleware like `upload` manages file uploads, ensuring that files are stored in the correct directories and that only specified file types are accepted.

## Known limitations / in-progress
- The middleware functions are currently hardcoded with certain configurations. Consider refactoring them to allow for easier customization.
- The file upload middleware (`upload`) should include validation for file sizes and MIME types.
```
