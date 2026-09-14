```md
# Webhook.Controller

**Status:** released (~100% complete, if known)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This controller handles webhooks for various services, including leave approvals and financial reports. It verifies incoming messages, dispatches them to appropriate handlers, and sends the processed data to external services like N8N.

## Where it lives in the UI
- Backend API route

## Key flows
1. Users send HTTP POST requests to the webhook endpoint with a JSON payload.
2. The controller verifies the request and dispatches the payload to the appropriate handler based on the event type.
3. For specific events, the controller fetches data from backend services and sends it to an N8N workflow endpoint for further processing.

## Known limitations / in-progress
- Currently, no frontend screens consume the webhook data directly. The webhook data is used internally by backend services and an N8N workflow.
- No frontend configuration or UI to set up the webhook.
- The HMAC secret for signing requests is hardcoded in the code and not configurable.
```
