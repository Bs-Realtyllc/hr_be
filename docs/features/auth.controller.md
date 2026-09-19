# Auth Controller

**Status:** released (~100% complete)
**Last updated:** 2026-09-19 — from commit 51da3b0

## What it does
This API controller handles authentication-related operations such as user login, OTP verification, password change, and password reset.

## Where it lives in the UI
N/A

## Key flows
1. **Login**: User submits a login request with their credentials. The API verifies the credentials and sends a JSON response with the authentication result.
2. **Verify OTP**: User submits a OTP verification request along with their OTP and IP address. The API verifies the OTP and sends a JSON response with the authentication result.
3. **Change Password**: User submits a password change request with their new password. The API updates the user's password.
4. **Forgot Password**: User submits a password reset request with their email. The API sends a password reset link to the user's email.
5. **Reset Password**: User submits a password reset request with their new password and reset code. The API resets the user's password and sends a success message.

## Known limitations / in-progress
- Authentication errors are not detailed enough in the API responses. Improvements can be made to provide more specific error messages.
- The authentication process does not include any client-side validation. Client-side validation should be added for better security and user experience.
