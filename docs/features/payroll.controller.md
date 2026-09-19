# Payroll Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This controller handles various payroll-related operations such as getting payroll information, updating salaries, resetting passwords, getting taxes, updating tax profiles, getting adjustments, building summary, and running year-end bonuses. It also generates financial reports based on specified employee and date parameters.

## Where it lives in the UI
- API route: GET `/api/payroll`
- API route: PUT `/api/payroll/:id`
- API route: PATCH `/api/payroll/password`
- API route: GET `/api/payroll/taxes`
- API route: PUT `/api/payroll/tax-profile/:id`
- API route: GET `/api/payroll/adjustments`
- API route: GET `/api/payroll/summary`
- API route: POST `/api/payroll/year-end-bonus`
- API route: GET `/api/payroll/financial-report`
