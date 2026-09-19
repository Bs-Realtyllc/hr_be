# Roadmap

**Status:** released (~100% complete)

## What it does
Fetches and displays a list of projects with their roadmap information, including key details like title, description, deadline, and progress.

## Where it lives in the UI
- Backend API route: `/api/roadmap`

## Known limitations / in-progress
- No user-facing screens for this feature. It is consumed by other parts of the application that need to fetch and display this information.
- The API is currently part of the `src/controllers/roadmap.controller.ts` file.
