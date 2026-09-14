```md
# Google

**Status:** released (~100% complete) (~95%)

**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This feature provides a Google authentication and API integration for users. It includes endpoints for obtaining an authorization URL, handling callback requests, retrieving the authentication status, disconnecting from Google, syncing user data, and handling Webhooks from the Google server.

## Where it lives in the UI
- Backend API routes: 
  - `getAuthUrl`
  - `handleCallback`
  - `getStatus`
  - `disconnect`
  - `sync`
  - `webhook`

## Key flows
1. **User initiates authentication:**
   - The user navigates to the authorization URL provided by `getAuthUrl`.
   - After the user grants permission and returns, the frontend redirects to the specified URL with the callback.
   - The frontend then calls `handleCallback` with the authorization code.
   - If successful, the user is redirected to a success URL, otherwise, they are redirected to the error URL.
2. **User requests status information:**
   - The user accesses the `getStatus` route to get the current status of the authentication session.
   - The backend returns the status information in JSON format.
3. **User disconnects from Google:**
   - The user navigates to the `disconnect` route to log out of the Google service.
   - The backend responds with a confirmation message.
4. **User syncs data with Google:**
   - The user navigates to the `sync` route to synchronize their data.
   - The backend executes the data synchronization using the `sync` route.
5. **User receives Webhook notifications:**
   - The backend receives a Webhook notification from the Google server.
   - The backend handles the Webhook notification and responds with a status code.

## Known limitations / in-progress
- Ensure that the frontend environment variables (`process.env.FRONTEND_URL`) are correctly set to enable proper redirections.
- Verify that the Google service (`googleService`) is properly integrated and that all authentication-related logic is correctly implemented.
- Monitor the Webhook notifications for any errors or unexpected behavior.
- Ensure that the Webhook route (`webhook`) is properly configured and secure.
```
