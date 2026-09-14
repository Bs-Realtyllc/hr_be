```md
# Auth.controller

**Status:** released (~100% complete) (~90% complete, if known)

## What it does
The Auth.controller handles user authentication-related operations, including login, OTP verification, password change, and password reset.

## Where it lives in the UI
N/A

## Key flows
1. **Login**: A user navigates to the login screen to enter their credentials. The `login` function is called with the provided credentials and the IP address. It uses the `auth.service` to authenticate the user and returns the result.
2. **Verify OTP**: A user verifies their OTP to complete the login process. The `verifyOtp` function is called with the OTP and the IP address. It uses the `auth.service` to verify the OTP and returns the result.
3. **Change Password**: A user changes their password by calling the `changePassword` function with their ID and the new password details. The `auth.service` updates the password in the database.
4. **Forgot Password**: A user requests a password reset by calling the `forgotPassword` function with the email address. The `auth.service` sends a reset link to the email address.
5. **Reset Password**: A user resets their password by calling the `resetPassword` function with the reset link details. The `auth.service` updates the password in the database.

## Known limitations / in-progress
- The OTP verification process is currently undergoing refactoring to improve its security and user experience.
- The password reset functionality is currently incomplete, as the reset link generation and email sending logic is not implemented yet.
```
