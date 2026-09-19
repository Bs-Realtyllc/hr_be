# Webhook Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
The webhook controller handles webhook events for services such as n8n, triggering reports based on received events.

## Where it lives in the UI
- Backend API route for the webhook service.

## Key flows
1. The webhook controller listens for events sent by the n8n service.
2. Upon receiving a valid event, it processes the data and sends it to the n8n webhook service.
3. The webhook service, triggered by the webhook controller, then sends the data to the n8n webhook service.

## Known limitations / in-progress
- No specific known limitations or in-progress items are currently noted.
