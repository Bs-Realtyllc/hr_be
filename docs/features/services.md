``nd
---
layout: default
title: Services Overview
---

# Services Overview

This directory contains various services that support different parts of the application. Each service is designed to handle specific operations related to its area, such as managing user authentication, fetching culture events, and generating email templates. Below is a brief overview of each service and what it handles:

## Authentication
- **Login**: Handles authentication for employees, including verifying OTPs and changing passwords.
- **Forgot Password**: Sends a reset link to an employee's email for resetting their password.
- **Reset Password**: Updates the employee's password based on the reset link provided.

## Culture Events
- **Upcoming**: Fetches upcoming culture events.
- **List**: Lists recent culture events.

## Dashboard
- **Get Stats**: Fetches various statistics related to employees, such as active employees, on leave, new hires, pending leaves, pending overtime, standup counts, and active projects.
- **Standup Trend**: Fetches standup trend data over the past 30 days.
- **Leave Trend**: Fetches leave trend data over the past 30 days.

## Email Settings
- **Get**: Fetches email settings for an employee.
- **Save**: Saves email settings for an employee. If a password is provided, it also tests the SMTP settings.

## Holiday Management
- **List**: Lists upcoming holidays.

## Leave Management
- **Create**: Handles creating leaves.
- **List**: Lists leaves.

## Leave Email Templates
- **List**: Lists available leave email templates.

## Meetings
- **List**: Lists upcoming meetings.

## Monthly Reports
- **List**: Lists recent monthly reports.

## Onboarding
- **List**: Lists onboarding processes.

## Overtime Management
- **Create**: Handles overtime requests.
- **List**: Lists pending overtime requests.

## Payroll Management
- **List**: Lists recent payroll reports.

## Performance Management
- **List**: Lists recent performance reports.

## Policies
- **Acknowledgements**: Manages policy acknowledgements and approvals.

## Profile Management
- **Create**: Handles profile creation.

## Projects
- **List**: Lists active projects.

## Server Management
- **List**: Lists server-related information.

## Service Credentials
- **List**: Lists service credentials.

## Standups
- **List**: Lists upcoming standups.

## Weekly Reminders
- **List**: Lists upcoming weekly reminders.

## Weekly Reports
- **List**: Lists recent weekly reports.
```
