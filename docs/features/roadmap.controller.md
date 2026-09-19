# Roadmap

**Status:** in-development (~20%)

**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
Fetches and displays a roadmap of projects that are opted-in to a public roadmap. Computes the progress of each project's todos, including total todos and completed todos, and returns this information.

## Where it lives in the UI
- Backend API route: `/api/roadmap`

## Known limitations / in-progress
- Computing the roadmap for each project in parallel. There are potential race conditions and synchronization issues.
- The function does not check if the `roadmap_key` is set before fetching data, which might lead to incorrect data in the response.
