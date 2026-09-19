# Auth Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit d0bb07b

## What it does
This controller handles authentication-related operations such as user login, OTP verification, password change, and password reset.

## Where it lives in the UI
The auth controller routes are consumed by various frontend components to handle user authentication flows.

## Key flows
1. User logs in via the `/login` API route.
2. User verifies their OTP via the `/verifyOtp` API route.
3. User changes their password via the `/changePassword` API route.
4. User resets their password via the `/resetPassword` API route.

## Known limitations / in-progress
- The OTP verification route may need additional UI elements for better user experience, such as a way to resend the OTP.
- Password reset functionality should ensure that the reset link is sent to the correct email and includes instructions for the user to confirm the reset.
- The login flow might benefit from additional validation steps, such as checking the IP address against a list of known bad actors.
