# Google.Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller provides endpoints for Google integration on the backend, allowing users to authenticate, get status updates, disconnect, and sync their data.

## Where it lives in the UI
- Backend API routes

## Key flows
1. **Authentication:**
   - GET `/auth-url`: Exposes a URL for users to authenticate with Google.
   - POST `/handle-callback`: Handles the OAuth callback after a user authenticates through Google.
   - GET `/status`: Retrieves the current status of the Google integration.

2. **Disconnect:**
   - POST `/disconnect`: Disconnects the user from the Google integration.
   - GET `/sync`: Synchronizes user data with Google.

3. **Webhook:**
   - POST `/webhook`: Receives and processes webhook events from Google, acknowledging the receipt with a response.

## Known limitations / in-progress
- No visible screens or UI components for end-users. The endpoints are consumed by other parts of the application (frontend, calendar management).
