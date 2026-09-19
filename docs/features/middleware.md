# Middleware

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
The middleware in this project handles various aspects such as rate limiting, authentication, error handling, and file uploads. It also includes a custom multer storage for file uploads.

## Where it lives in the UI
Middleware is not a part of the UI; it is used internally by other components and routes.

## Key flows
1. Authentication middleware is used to authenticate incoming requests. It verifies the JWT token provided in the Authorization header.
2. Rate limiters are applied to prevent abuse of resources.
3. Error handling middleware catches and handles errors to provide appropriate responses.
4. Uploader middleware handles file uploads using multer. It ensures files are of valid types and limits their size.

## Known limitations / in-progress
- The error handling middleware logs the error to the console and returns a generic error message if no status code is provided in the error object.
- The multer storage does not handle the case where the 'uploads/' directory does not exist. It should be created using `fs.mkdirSync(dir, { recursive: true });`.
