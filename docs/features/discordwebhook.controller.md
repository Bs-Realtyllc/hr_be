# DiscordWebhook.Controller

**Status:** released (~100%)

**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles incoming webhook events from Discord. It processes standup submissions from both public users and internal bots, validating the input and storing the data in the database.

## Where it lives in the UI
- N/A

## Key flows
1. Public users submit standup submissions via a webhook event.
2. Internal bots submit standup submissions via an internal token.

## Known limitations / in-progress
- No significant known limitations at this time.
- Ensure the `DISCORD_PUBLIC_KEY` and `DISCORD_INTERNAL_TOKEN` environment variables are properly configured and secure.
