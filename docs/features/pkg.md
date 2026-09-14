```md
# pkg

**Status:** released (~100% complete, if known)
**Last updated:** 2026-09-14 — from commit 0748221

## What it does
This package includes utility functions for handling payroll calculations, tax estimations, and error handling. It also provides validation functions for input data.

## Where it lives in the UI
N/A

## Key flows
1. **Payroll Calculation:**
   - Calculate monthly salary based on input data.
   - Apply overtime rates if hours worked exceed regular hours.
   - Deduct leave from salary.
   - Calculate year-end bonus based on remaining days.

2. **Tax Estimation:**
   - Estimate annual tax based on the taxable income provided.
   - Adjust for different tax brackets.

3. **Validation:**
   - Validate input data using a custom error handling mechanism.

## Known limitations / in-progress
- Documentation for the package functions and interfaces is incomplete.
- Some internal utility functions like `bindAndValidate` and `optionalNullable` are documented, but others are not.
- Error handling messages are not clearly specified in the `AppError` class.

```
