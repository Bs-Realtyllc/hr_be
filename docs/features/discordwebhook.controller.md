# DiscordWebhookController

**Status:** released (~100%)

**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller handles incoming webhooks from Discord, processing standup submissions for employees. It supports both public webhooks and internal submissions.

## Where it lives in the UI
- Backend API route: `/api/discordWebhook`

## Key flows
1. **Public Webhook:**
   - Incoming message from a Discord bot includes a JSON payload with `type` as `1` and `event` as `standup`.
   - The payload contains fields such as `discordName`, `workedOn`, `completed`, `inProgress`, `nextUp`, `blockers`, and `links`.
   - The webhook verifies the signature and timestamp, then calls the `findEmployeeByDiscordName` service to find the employee matching the `discordName`.
   - If the employee is found, the controller saves the standup details in the database. The response is a JSON with a success flag and the employee's name if successful, or an error message if the save operation fails.

2. **Internal Webhook:**
   - Incoming message from an internal bot includes a JSON payload with only `discordName`, `workedOn`, and `completed` fields.
   - The payload is verified and the `findEmployeeByDiscordName` service is used to locate the employee.
   - If the employee is found, the controller saves the standup details in the database.
   - The response is a JSON with a success flag and the employee's name if successful, or an error message if the save operation fails.

## Known limitations / in-progress
- Currently, only internal and public webhooks are supported. There are no plans to add support for other types of webhooks.
