# Webhook.Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles webhook events from external services and triggers internal reports.

## Where it lives in the UI
Backend API route.

## Key flows
1. **Verification**:
   - Receives a verification GET request with a `hub.mode` and `hub.verify_token`.
   - Verifies the request using environment variables for `WEBHOOK_VERIFY_TOKEN` and `WEBHOOK_SECRET`.
   - If the token matches, the request is verified and a challenge is sent back.
   - If not, the request is rejected with a 403 status.
2. **Event Reception**:
   - Receives events such as `url_verification`, `leave_approved`, and `month_end_report`.
   - Verifies the event type and payload against expected secrets.
   - Dispatches the event to the appropriate handler based on the event type.
3. **Monthly Report**:
   - Triggers a monthly report by sending a POST request to an N8N workflow with performance, leave, and financial data.
   - The request includes a HMAC signature for security.
   - Upon successful response, a success message is sent back.
   - If the response is not successful, an error message is sent back with details of the N8N workflow's error.

## Known limitations / in-progress
- The `leave_approved` event handler is not explicitly documented here; see the `EVENT_HANDLERS` configuration.
- The `month_end_report` function triggers multiple internal reports (`leave_report`, `performance_report`, `financial_report`).
- The HMAC signature is manually created and sent in the POST request, without using the `crypto` module.
