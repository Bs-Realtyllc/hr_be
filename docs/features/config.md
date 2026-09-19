# config

**Status:** released (~100%)

## What it does
Manages database connections for the HR platform.

## Where it lives in the UI
N/A

## Key flows
1. Configuration of database connection details is managed via environment variables.
2. The `drizzle` ORM is used to interact with the MySQL database.
3. Default connection settings are configured in `src/config/database.ts`.

## Known limitations / in-progress
- No known limitations or in-progress work for this feature.
