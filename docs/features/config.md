# Config

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
The `src/config/database.ts` file manages database connections for the HR platform.

## Where it lives in the UI
N/A

## Known limitations / in-progress
- The database configuration is hard-coded in the `src/config/database.ts` file. Consider using environment variables or a configuration management tool for better separation of concerns.
- The database connection pool and ORM settings are configured using default values, which might need to be adjusted for production environments.
