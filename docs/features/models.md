# Features - Models
## **Status:** In Development

## Employees
- **Employee:** Provides detailed information about each employee, including their ID, name, email, password, and timestamps for creation and last login.
- **EmployeeOnboardingProfile:** Records the progress of each employee's onboarding process, capturing milestones and feedback.
- **EmployeeDocuments:** Stores documents associated with each employee, such as ID cards, references, and diplomas.
- **EmployeeCompensationHistory:** Tracks an employee's compensation history, including salary changes, bonuses, and deductions.

## Departments
- **Department:** Defines the structure of departments within an organization, including ID, name, and timestamps for creation and updates.

## Designations
- **Designation:** Contains details about different job roles within a company, including ID, name, and timestamps for creation and updates.

## PasswordResetTokens
- **PasswordResetToken:** Logs tokens used for password reset requests, capturing the token value, expiration date, and timestamp for creation.

## LeaveRequests
- **LeaveRequest:** Tracks leave requests made by employees, including leave type, start and end dates, number of days, and timestamps for creation and status updates.

## LeaveBalances
- **LeaveBalance:** Records the leave balance of each employee, tracking the total days available for various leave types.

## Projects
- **Project:** Represents a project within an organization, with an ID, name, description, URL links, status, roadmap information, and timestamps for creation and status updates.
- **ProjectAssignment:** Links employees to their project assignments, specifying their role and timestamps for assignment and status updates.
- **ProjectService:** Records services provided by employees for specific projects, including timestamps for service assignment.
- **ProjectTodo:** Manages tasks assigned to employees for specific projects, capturing deadlines, status, and order within the project.

## Servers
- **Server:** Represents a server in a project's environment, including an ID, name, environment type, IP address, and domain information, and timestamps for creation and updates.

## ServiceCredentials
- **ServiceCredential:** Stores credentials for accessing external services, including an ID, employee ID, and service-specific credentials like username and password.

## Standups
- **Standup:** Logs standup meetings held within a project, recording employees' tasks, status updates, blockers, and links to relevant documents, along with timestamps for each meeting.

## WeeklyReports
- **WeeklyReport:** Holds weekly reports submitted by employees, including a title, start date, file path, and file name, with timestamps for creation and submission.
