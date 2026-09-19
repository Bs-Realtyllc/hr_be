# Validation

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This package provides utilities and validation functions for payroll calculations, tax estimation, and error handling in a payroll management system.

## Where it lives in the UI
N/A

## Key flows
1. **Payroll Calculation:**
   - Calculate monthly salary based on pay frequency.
   - Calculate daily and hourly rates.
   - Handle overtime pay and leave deductions.
   - Calculate year-end leave bonus.

2. **Tax Calculation:**
   - Estimate annual tax based on taxable income using different tax brackets.
   - Convert annual salary to biweekly or weekly pay frequency.

3. **Error Handling:**
   - Validate input data using a schema and throw an `AppError` if validation fails.

## Known limitations / in-progress
- Currently, only the base validation functions are included. More complex validation scenarios or custom validation functions are planned but not yet implemented.
