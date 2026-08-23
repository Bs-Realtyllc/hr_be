import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HR Platform API",
      version: "1.0.0",
      description:
        "Internal HR management platform — auth, employees, leaves, standups, projects, servers, payroll, profile, reports, and integrations (Google Calendar, Discord, generic webhooks).",
    },
    servers: [
      { url: "http://localhost:6002", description: "Local development" },
    ],
    tags: [
      { name: "Health", description: "Service health check" },
      { name: "Auth", description: "Login, password change/reset" },
      { name: "Employees", description: "Employee profiles and directory" },
      { name: "Leaves", description: "Leave requests and balances" },
      { name: "Standups", description: "Async daily standup feed" },
      {
        name: "Projects",
        description: "Projects, assignments, milestones, and services",
      },
      { name: "Servers", description: "Server and environment configs" },
      {
        name: "Events",
        description: "Culture events — birthdays, anniversaries, milestones",
      },
      {
        name: "Payroll",
        description:
          "Salary, pay-frequency, and tax-profile management (admin/lead)",
      },
      {
        name: "Goals",
        description: "Individual, team, and company goals / KPI tracking",
      },
      {
        name: "Performance",
        description: "Performance review cycles and ratings",
      },
      {
        name: "Feedback",
        description: "Peer, manager, and public recognition feedback notes",
      },
      { name: "Profile", description: "The logged-in employee's own profile" },
      { name: "Reports", description: "Monthly report file submissions" },
      { name: "Dashboard", description: "Aggregate stats and trends" },
      {
        name: "Google Calendar",
        description: "Google OAuth connection and calendar sync",
      },
      {
        name: "Meetings",
        description: "Scheduled meetings backed by Google Calendar",
      },
      {
        name: "Discord",
        description: "Discord bot / Webhook Events integration for standups",
      },
      {
        name: "Email Settings",
        description: "Per-employee SMTP configuration for leave notifications",
      },
      {
        name: "Service Credentials",
        description: "Per-employee third-party service credentials",
      },
      {
        name: "Webhooks",
        description: "Generic inbound webhook endpoint for external services",
      },
      {
        name: "FormLayout",
        description: "Dynamic onboarding form field configuration",
      },
      {
        name: "Onboard",
        description: "Public onboarding applications and contract review",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Obtained from POST /api/auth/login. Send as `Authorization: Bearer <token>`.",
        },
      },
      schemas: {
        Employee: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string", example: "Jane Doe" },
            email: {
              type: "string",
              format: "email",
              example: "jane@company.com",
            },
            phone: { type: "string", example: "+977 98XXXXXXXX" },
            emergency_contact: { type: "string" },
            designation: { type: "string", example: "Senior Backend Engineer" },
            department: { type: "string", example: "Engineering" },
            manager_id: { type: "integer", nullable: true },
            manager_name: { type: "string", nullable: true },
            start_date: {
              type: "string",
              format: "date",
              example: "2023-01-15",
            },
            timezone: { type: "string", example: "Asia/Kathmandu" },
            work_hours: { type: "string", example: "9 AM - 5 PM" },
            tech_stack: {
              type: "array",
              items: { type: "string" },
              example: ["Go", "React", "MySQL"],
            },
            role: {
              type: "string",
              enum: ["admin", "lead", "employee", "intern"],
              example: "employee",
            },
            discord_username: { type: "string", nullable: true },
            salary: { type: "number", nullable: true },
            pay_frequency: {
              type: "string",
              enum: ["monthly", "biweekly", "weekly"],
              nullable: true,
            },
            profile_picture: { type: "string", nullable: true },
            is_active: { type: "boolean" },
            status: {
              type: "string",
              enum: [
                "onboarding",
                "active",
                "on_leave",
                "probation",
                "terminated",
              ],
            },
            gender: {
              type: "string",
              enum: ["male", "female", "other", "prefer_not_to_say"],
              nullable: true,
            },
            permanent_address: { type: "string", nullable: true },
            education_level: { type: "string", nullable: true },
            institution_name: { type: "string", nullable: true },
            field_of_study: { type: "string", nullable: true },
            graduation_date: { type: "string", format: "date", nullable: true },
            previous_experience: { type: "string", nullable: true },
            areas_of_interest: { type: "string", nullable: true },
            linkedin_url: { type: "string", nullable: true },
            github_url: { type: "string", nullable: true },
            portfolio_url: { type: "string", nullable: true },
            emergency_contact_name: { type: "string", nullable: true },
          },
        },
        EmployeeInput: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string", example: "Jane Doe" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            emergency_contact: { type: "string" },
            emergency_contact_name: { type: "string", nullable: true },
            designation: { type: "string" },
            department: { type: "string" },
            manager_id: { type: "integer", nullable: true },
            start_date: { type: "string", format: "date" },
            timezone: { type: "string", default: "UTC" },
            work_hours: { type: "string", default: "9 AM - 5 PM" },
            tech_stack: { type: "array", items: { type: "string" } },
            role: {
              type: "string",
              enum: ["admin", "lead", "employee", "intern"],
              default: "employee",
            },
            status: {
              type: "string",
              enum: ["onboarding", "active"],
              default: "active",
              description:
                "Create only — 'onboarding' creates a pending applicant (is_active = false) awaiting approval via PUT /{id}/approve or PUT /{id}/reject.",
            },
            discord_username: {
              type: "string",
              description:
                "Update only — matched against Discord standup submissions",
            },
            gender: {
              type: "string",
              enum: ["male", "female", "other", "prefer_not_to_say"],
              nullable: true,
            },
            permanent_address: { type: "string", nullable: true },
            education_level: { type: "string", nullable: true },
            institution_name: { type: "string", nullable: true },
            field_of_study: { type: "string", nullable: true },
            graduation_date: { type: "string", format: "date", nullable: true },
            previous_experience: { type: "string", nullable: true },
            areas_of_interest: { type: "string", nullable: true },
            linkedin_url: { type: "string", nullable: true },
            github_url: { type: "string", nullable: true },
            portfolio_url: { type: "string", nullable: true },
          },
        },
        EmployeePayrollSummary: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            designation: { type: "string" },
            department: { type: "string" },
            salary: { type: "number", nullable: true },
            pay_frequency: { type: "string", nullable: true },
            start_date: { type: "string", format: "date" },
            working_days_this_month: { type: "integer" },
            leave_days_this_month: { type: "integer" },
            present_days: { type: "integer" },
            daily_rate: { type: "integer" },
            expected_pay: { type: "integer" },
          },
        },
        LeaveRequest: {
          type: "object",
          properties: {
            id: { type: "integer" },
            employee_id: { type: "integer" },
            employee_name: { type: "string" },
            designation: { type: "string" },
            leave_type: {
              type: "string",
              enum: [
                "sick",
                "bereavement",
                "maternity",
                "paternity",
                "casual",
                "annual",
              ],
            },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            reason: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
            },
            reviewer_name: { type: "string", nullable: true },
            reviewed_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        LeaveUpdateInput: {
          type: "object",
          properties: {
            leave_type: {
              type: "string",
              enum: ["sick", "bereavement", "maternity", "paternity"],
            },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            reason: { type: "string" },
          },
        },
        LeaveBalance: {
          type: "object",
          properties: {
            leave_type: {
              type: "string",
              enum: ["sick", "bereavement", "maternity", "paternity"],
            },
            total: { type: "integer" },
            taken: { type: "integer" },
            remaining: { type: "integer" },
            year: { type: "integer" },
          },
        },
        Standup: {
          type: "object",
          properties: {
            id: { type: "integer" },
            employee_id: { type: "integer" },
            employee_name: { type: "string" },
            designation: { type: "string" },
            yesterday: { type: "string" },
            today: { type: "string" },
            blockers: { type: "string", nullable: true },
            standup_date: { type: "string", format: "date" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string", example: "Gitgi Platform" },
            description: { type: "string" },
            repo_url: {
              type: "array",
              items: { type: "string", format: "uri" },
            },
            docs_url: {
              type: "array",
              items: { type: "string", format: "uri" },
            },
            status: { type: "string", enum: ["active", "archived", "on_hold"] },
            start_date: { type: "string", format: "date", nullable: true },
            expected_end_date: {
              type: "string",
              format: "date",
              nullable: true,
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ProjectByEmployee: {
          allOf: [
            { $ref: "#/components/schemas/Project" },
            {
              type: "object",
              properties: {
                assigned_role: {
                  type: "string",
                  enum: [
                    "lead",
                    "backend",
                    "frontend",
                    "ui_ux",
                    "qa",
                    "devops",
                  ],
                },
                milestones: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Milestone" },
                },
              },
            },
          ],
        },
        Milestone: {
          type: "object",
          properties: {
            id: { type: "integer" },
            project_id: { type: "integer" },
            title: { type: "string" },
            due_date: { type: "string", format: "date" },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed"],
            },
          },
        },
        Assignment: {
          type: "object",
          properties: {
            id: { type: "integer" },
            project_id: { type: "integer" },
            employee_id: { type: "integer" },
            name: { type: "string" },
            designation: { type: "string" },
            profile_picture: { type: "string", nullable: true },
            role: {
              type: "string",
              enum: ["lead", "backend", "frontend", "ui_ux", "qa", "devops"],
            },
            timezone: { type: "string" },
          },
        },
        Server: {
          type: "object",
          properties: {
            id: { type: "integer" },
            project_id: { type: "integer", nullable: true },
            project_name: { type: "string", nullable: true },
            name: { type: "string", example: "prod-api-01" },
            environment: {
              type: "string",
              enum: ["development", "staging", "production"],
            },
            ip_address: {
              type: "string",
              example: "192.168.1.10",
              description:
                "Masked as •••••••• when is_sensitive=true and show_sensitive is not requested",
            },
            domain: {
              type: "string",
              example: "api.company.com",
              nullable: true,
            },
            ssh_user: {
              type: "string",
              example: "deploy",
              description:
                "Masked as •••••••• when is_sensitive=true and show_sensitive is not requested",
            },
            notes: { type: "string", nullable: true },
            is_sensitive: { type: "boolean" },
          },
        },
        CultureEvent: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string", example: "Jane's Birthday" },
            event_type: {
              type: "string",
              enum: ["birthday", "anniversary", "team_event", "milestone"],
            },
            employee_id: { type: "integer", nullable: true },
            employee_name: { type: "string", nullable: true },
            event_date: { type: "string", format: "date" },
            description: { type: "string", nullable: true },
          },
        },

        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Must be on an allowed organization domain",
            },
            password: { type: "string", format: "password" },
          },
        },
        UserSummary: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["admin", "lead", "employee"] },
            designation: { type: "string" },
            department: { type: "string" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string", description: "JWT, valid for 7 days" },
            user: { $ref: "#/components/schemas/UserSummary" },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["new_password"],
          properties: {
            current_password: {
              type: "string",
              format: "password",
              description: "Required if the account already has a password set",
            },
            new_password: { type: "string", format: "password", minLength: 6 },
          },
        },
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", format: "email" } },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["token", "new_password"],
          properties: {
            token: {
              type: "string",
              description: "Token from the reset-password email link",
            },
            new_password: { type: "string", format: "password", minLength: 6 },
          },
        },
        MessageResponse: {
          type: "object",
          properties: { message: { type: "string" } },
        },

        DashboardStats: {
          type: "object",
          properties: {
            total_active: { type: "integer" },
            on_leave_today: { type: "integer" },
            present_today: { type: "integer" },
            new_hires_month: { type: "integer" },
            pending_leaves: { type: "integer" },
            standups_today: { type: "integer" },
            active_projects: { type: "integer" },
          },
        },
        TrendPoint: {
          type: "object",
          properties: {
            date: { type: "string", format: "date" },
            count: { type: "integer" },
          },
        },

        PayrollEmployee: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            designation: { type: "string" },
            department: { type: "string" },
            role: { type: "string", enum: ["admin", "lead", "employee"] },
            salary: { type: "number", nullable: true },
            pay_frequency: {
              type: "string",
              enum: ["monthly", "biweekly", "weekly"],
              nullable: true,
            },
          },
        },
        SalaryUpdateInput: {
          type: "object",
          properties: {
            salary: { type: "number", nullable: true },
            pay_frequency: {
              type: "string",
              enum: ["monthly", "biweekly", "weekly"],
              default: "monthly",
            },
          },
        },
        AdminPasswordResetInput: {
          type: "object",
          required: ["password"],
          properties: {
            password: { type: "string", format: "password", minLength: 6 },
          },
        },
        PayrollTaxEmployee: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            designation: { type: "string" },
            department: { type: "string" },
            role: { type: "string", enum: ["admin", "lead", "employee"] },
            salary: { type: "number", nullable: true },
            pay_frequency: {
              type: "string",
              enum: ["monthly", "biweekly", "weekly"],
              nullable: true,
            },
            tax_id: { type: "string", nullable: true },
            country: { type: "string" },
            filing_status: {
              type: "string",
              enum: ["single", "married", "head_of_household"],
            },
            tax_regime: { type: "string", enum: ["old", "new"] },
            exemptions: { type: "number" },
            additional_withholding: { type: "number" },
            notes: { type: "string", nullable: true },
            annual_salary: { type: "number" },
            taxable_income: { type: "number" },
            estimated_annual_tax: { type: "number" },
            estimated_monthly_tax: { type: "number" },
            effective_rate: {
              type: "number",
              description: "Estimated effective tax rate as a percentage",
            },
          },
        },
        TaxProfileInput: {
          type: "object",
          properties: {
            tax_id: { type: "string" },
            country: { type: "string", default: "Nepal" },
            filing_status: {
              type: "string",
              enum: ["single", "married", "head_of_household"],
              default: "single",
            },
            tax_regime: {
              type: "string",
              enum: ["old", "new"],
              default: "new",
            },
            exemptions: { type: "number", default: 0 },
            additional_withholding: { type: "number", default: 0 },
            notes: { type: "string" },
          },
        },

        Goal: {
          type: "object",
          properties: {
            id: { type: "integer" },
            employee_id: { type: "integer" },
            employee_name: { type: "string" },
            designation: { type: "string" },
            department: { type: "string" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            category: {
              type: "string",
              enum: ["individual", "team", "company"],
            },
            metric_unit: { type: "string", example: "%" },
            target_value: { type: "number" },
            current_value: { type: "number" },
            weight: { type: "integer", minimum: 1, maximum: 5 },
            status: {
              type: "string",
              enum: [
                "not_started",
                "in_progress",
                "at_risk",
                "completed",
                "missed",
              ],
            },
            start_date: { type: "string", format: "date", nullable: true },
            due_date: { type: "string", format: "date", nullable: true },
            created_by_name: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
          },
        },
        GoalInput: {
          type: "object",
          required: ["title"],
          properties: {
            employee_id: {
              type: "integer",
              description: "Admin/lead only — defaults to self",
            },
            title: { type: "string" },
            description: { type: "string" },
            category: {
              type: "string",
              enum: ["individual", "team", "company"],
              default: "individual",
            },
            metric_unit: { type: "string", default: "%" },
            target_value: { type: "number", default: 100 },
            current_value: { type: "number", default: 0 },
            weight: { type: "integer", default: 3 },
            status: {
              type: "string",
              enum: [
                "not_started",
                "in_progress",
                "at_risk",
                "completed",
                "missed",
              ],
            },
            start_date: { type: "string", format: "date" },
            due_date: { type: "string", format: "date" },
          },
        },
        GoalProgressInput: {
          type: "object",
          properties: {
            current_value: { type: "number" },
            status: {
              type: "string",
              enum: [
                "not_started",
                "in_progress",
                "at_risk",
                "completed",
                "missed",
              ],
            },
          },
        },
        GoalSummary: {
          type: "object",
          properties: {
            employee_id: { type: "integer" },
            employee_name: { type: "string" },
            total_goals: { type: "integer" },
            completed_goals: { type: "integer" },
            at_risk_goals: { type: "integer" },
            avg_progress: {
              type: "number",
              nullable: true,
              description: "Average completion percentage across goals",
            },
          },
        },

        PerformanceReview: {
          type: "object",
          properties: {
            id: { type: "integer" },
            employee_id: { type: "integer" },
            employee_name: { type: "string" },
            designation: { type: "string" },
            department: { type: "string" },
            reviewer_id: { type: "integer", nullable: true },
            reviewer_name: { type: "string", nullable: true },
            review_period: { type: "string", example: "2026-H1" },
            overall_rating: {
              type: "number",
              nullable: true,
              minimum: 1,
              maximum: 5,
            },
            category_ratings: {
              type: "object",
              additionalProperties: { type: "number" },
              example: {
                technical: 4,
                communication: 5,
                teamwork: 4,
                ownership: 4,
              },
            },
            strengths: { type: "string", nullable: true },
            improvements: { type: "string", nullable: true },
            manager_comments: { type: "string", nullable: true },
            employee_comments: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["draft", "submitted", "acknowledged"],
            },
            submitted_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            acknowledged_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        PerformanceReviewInput: {
          type: "object",
          required: ["employee_id", "review_period"],
          properties: {
            employee_id: { type: "integer" },
            review_period: { type: "string", example: "2026-H1" },
            overall_rating: { type: "number", minimum: 1, maximum: 5 },
            category_ratings: {
              type: "object",
              additionalProperties: { type: "number" },
            },
            strengths: { type: "string" },
            improvements: { type: "string" },
            manager_comments: { type: "string" },
          },
        },
        PerformanceAcknowledgeInput: {
          type: "object",
          properties: { employee_comments: { type: "string" } },
        },
        RatingTrendPoint: {
          type: "object",
          properties: {
            review_period: { type: "string" },
            overall_rating: { type: "number" },
          },
        },

        FeedbackNote: {
          type: "object",
          properties: {
            id: { type: "integer" },
            from_employee_id: { type: "integer" },
            from_name: { type: "string" },
            from_designation: { type: "string" },
            to_employee_id: { type: "integer" },
            to_name: { type: "string" },
            to_designation: { type: "string" },
            feedback_type: {
              type: "string",
              enum: ["praise", "constructive", "peer", "manager"],
            },
            visibility: { type: "string", enum: ["public", "private"] },
            message: { type: "string" },
            project_id: { type: "integer", nullable: true },
            project_name: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
          },
        },
        FeedbackInput: {
          type: "object",
          required: ["to_employee_id", "message"],
          properties: {
            to_employee_id: { type: "integer" },
            feedback_type: {
              type: "string",
              enum: ["praise", "constructive", "peer", "manager"],
              default: "praise",
            },
            visibility: {
              type: "string",
              enum: ["public", "private"],
              default: "public",
            },
            message: { type: "string" },
            project_id: { type: "integer" },
          },
        },
        FeedbackSummary: {
          type: "object",
          properties: {
            employee_id: { type: "integer" },
            employee_name: { type: "string" },
            total_received: { type: "integer" },
            praise_count: { type: "integer" },
            constructive_count: { type: "integer" },
          },
        },

        Profile: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            alt_phone: { type: "string", nullable: true },
            emergency_contact: { type: "string", nullable: true },
            designation: { type: "string" },
            department: { type: "string" },
            dob: { type: "string", format: "date", nullable: true },
            bio: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            qualifications: {
              type: "array",
              items: { type: "string" },
              nullable: true,
            },
            profile_picture: { type: "string", nullable: true },
            citizenship_front: { type: "string", nullable: true },
            citizenship_back: { type: "string", nullable: true },
            timezone: { type: "string" },
            work_hours: { type: "string" },
            tech_stack: { type: "array", items: { type: "string" } },
            role: { type: "string", enum: ["admin", "lead", "employee"] },
            start_date: { type: "string", format: "date" },
          },
        },
        ProfileUpdateInput: {
          type: "object",
          properties: {
            phone: { type: "string" },
            alt_phone: { type: "string" },
            emergency_contact: { type: "string" },
            dob: { type: "string", format: "date" },
            bio: { type: "string" },
            address: { type: "string" },
            timezone: { type: "string" },
            work_hours: { type: "string" },
            qualifications: { type: "array", items: { type: "string" } },
          },
        },
        UploadResponse: {
          type: "object",
          properties: { filename: { type: "string" } },
        },

        MonthlyReport: {
          type: "object",
          properties: {
            id: { type: "integer" },
            employee_id: { type: "integer" },
            employee_name: { type: "string" },
            designation: { type: "string" },
            department: { type: "string" },
            title: { type: "string" },
            month: { type: "integer", minimum: 1, maximum: 12 },
            year: { type: "integer" },
            file_name: { type: "string" },
            file_size: { type: "integer" },
            notes: { type: "string", nullable: true },
            submitted_at: { type: "string", format: "date-time" },
          },
        },

        GoogleAuthUrl: {
          type: "object",
          properties: { url: { type: "string", format: "uri" } },
        },
        GoogleStatus: {
          type: "object",
          properties: {
            connected: { type: "boolean" },
            webhookActive: { type: "boolean" },
          },
        },
        GoogleSyncResult: {
          type: "object",
          properties: { synced: { type: "integer" } },
        },
        Meeting: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            start_datetime: { type: "string", format: "date-time" },
            end_datetime: { type: "string", format: "date-time" },
            attendees: {
              type: "array",
              items: { type: "string", format: "email" },
            },
            google_event_id: { type: "string", nullable: true },
            meet_link: { type: "string", format: "uri", nullable: true },
            status: { type: "string", enum: ["scheduled", "cancelled"] },
            created_by: { type: "integer" },
            creator_name: { type: "string", nullable: true },
          },
        },
        MeetingInput: {
          type: "object",
          required: ["title", "start_datetime", "end_datetime"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            start_datetime: { type: "string", format: "date-time" },
            end_datetime: { type: "string", format: "date-time" },
            attendees: {
              type: "array",
              items: { type: "string", format: "email" },
            },
          },
        },
        MeetingCreated: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            start_datetime: { type: "string", format: "date-time" },
            end_datetime: { type: "string", format: "date-time" },
            meetLink: { type: "string", format: "uri", nullable: true },
            googleEventId: { type: "string", nullable: true },
          },
        },

        EmailSettings: {
          type: "object",
          properties: {
            smtp_host: { type: "string" },
            smtp_port: { type: "integer" },
            smtp_user: { type: "string" },
            smtp_from: { type: "string" },
            default_to: { type: "string", nullable: true },
            default_cc: { type: "string", nullable: true },
            default_bcc: { type: "string", nullable: true },
          },
        },
        EmailSettingsInput: {
          type: "object",
          required: ["smtp_host", "smtp_user"],
          properties: {
            smtp_host: { type: "string" },
            smtp_port: { type: "integer", default: 587 },
            smtp_user: { type: "string" },
            smtp_pass: {
              type: "string",
              format: "password",
              description:
                "Required on initial setup; omit to keep the stored password unchanged",
            },
            smtp_from: { type: "string" },
            default_to: { type: "string" },
            default_cc: { type: "string" },
            default_bcc: { type: "string" },
          },
        },

        ServiceCredential: {
          type: "object",
          properties: {
            service_name: { type: "string", example: "AWS Console" },
            username: { type: "string" },
            notes: { type: "string", nullable: true },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        ServiceCredentialInput: {
          type: "object",
          required: ["service_name"],
          properties: {
            service_name: { type: "string" },
            username: { type: "string" },
            password: {
              type: "string",
              format: "password",
              description: "Left unchanged if omitted/blank on update",
            },
            notes: { type: "string" },
          },
        },
        FormLayoutField: {
          type: "object",
          properties: {
            key: { type: "string", example: "email" },
            type: { type: "string", example: "text" },
            label: { type: "string", example: "Email Address" },
            section: { type: "string", example: "personal" },
            required: { type: "boolean" },
          },
        },
        FormLayoutResponse: {
          type: "object",
          description: "Fields grouped by section key",
          additionalProperties: {
            type: "array",
            items: { $ref: "#/components/schemas/FormLayoutField" },
          },
        },
        OnboardProfile: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            dob: { type: "string", format: "date", nullable: true },
            gender: { type: "string", nullable: true },
            email: { type: "string", format: "email" },
            current_address: { type: "string", nullable: true },
            education_level: { type: "string", nullable: true },
            institution_name: { type: "string", nullable: true },
            field_of_study: { type: "string", nullable: true },
            graduation_date: { type: "string", format: "date", nullable: true },
            previous_experience: { type: "string", nullable: true },
            areas_of_interest: { type: "string", nullable: true },
            linkedin_url: { type: "string", nullable: true },
            github_url: { type: "string", nullable: true },
            portfolio_url: { type: "string", nullable: true },
            role: { type: "string", enum: ["intern", "employee"] },
            additional_info: { type: "string", nullable: true },
            nda_path: {
              type: "string",
              nullable: true,
              description: "Stored filename of the uploaded signed contract",
            },
            status: { type: "string", nullable: true },
          },
        },

        Error: {
          type: "object",
          properties: { error: { type: "string" } },
        },
        Created: {
          type: "object",
          properties: { id: { type: "integer" } },
        },
        Success: {
          type: "object",
          properties: { success: { type: "boolean", example: true } },
        },
      },
    },
    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            200: {
              description: "Server is up",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      timestamp: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Log in with company email and password",
          description:
            "Restricted to allowed organization email domains. Returns a JWT valid for 7 days.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginResponse" },
                },
              },
            },
            400: {
              description: "Missing email or password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Email domain not allowed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/password": {
        put: {
          tags: ["Auth"],
          summary: "Change the logged-in user's password",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MessageResponse" },
                },
              },
            },
            400: {
              description: "Password too short",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            401: {
              description: "Current password incorrect / not authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request a password reset email",
          description:
            "Always responds with the same message regardless of whether the email exists, to prevent enumeration.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Request accepted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MessageResponse" },
                },
              },
            },
          },
        },
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password using a token from the reset email",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Password reset",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MessageResponse" },
                },
              },
            },
            400: {
              description: "Invalid/expired token or bad password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/dashboard/stats": {
        get: {
          tags: ["Dashboard"],
          summary: "Aggregate headcount, leave, and project stats",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Stats",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DashboardStats" },
                },
              },
            },
          },
        },
      },
      "/api/dashboard/standup-trend": {
        get: {
          tags: ["Dashboard"],
          summary: "Standup submission counts for the last 30 days",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Array of daily counts",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TrendPoint" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/dashboard/leave-trend": {
        get: {
          tags: ["Dashboard"],
          summary: "Leave request submission counts for the last 30 days",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Array of daily counts",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TrendPoint" },
                  },
                },
              },
            },
          },
        },
      },

      "/api/employees": {
        get: {
          tags: ["Employees"],
          summary: "List all active employees",
          responses: {
            200: {
              description: "Array of employees",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Employee" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Employees"],
          summary: "Create a new employee",
          description:
            "Also seeds default leave balances (sick 12, bereavement 3, maternity 60, paternity 30) for the current year.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EmployeeInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Employee created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
            500: {
              description: "DB error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/employees/onboarding": {
        get: {
          tags: ["Employees"],
          summary: "List pending applicants awaiting approval",
          description:
            "Admin only. Returns employees created with status = 'onboarding' (is_active = false).",
          responses: {
            200: {
              description: "Array of pending applicants",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Employee" },
                  },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/employees/{id}": {
        get: {
          tags: ["Employees"],
          summary: "Get employee by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Employee",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Employee" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
        put: {
          tags: ["Employees"],
          summary: "Update employee fields",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EmployeeInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Nothing to update",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Employees"],
          summary: "Soft-delete employee (sets is_active = false)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Deactivated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
          },
        },
      },
      "/api/employees/{id}/payroll-summary": {
        get: {
          tags: ["Employees"],
          summary: "Payroll summary for an employee for the current month",
          description:
            "Computes working days, approved-leave days, present days, and expected pay based on salary ÷ working days.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Payroll summary",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/EmployeePayrollSummary",
                  },
                },
              },
            },
            404: {
              description: "Not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/employees/{id}/approve": {
        put: {
          tags: ["Employees"],
          summary: "Approve a pending applicant",
          description:
            "Admin only. Sets is_active = true and status = 'active', generates a one-time password, and emails it to the employee's company email. Fails if the employee is not currently in 'onboarding' status.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Approved",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Employee is not a pending applicant",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },
      "/api/employees/{id}/reject": {
        put: {
          tags: ["Employees"],
          summary: "Reject a pending applicant",
          description:
            "Admin only. Permanently deletes the employee record. Only allowed while the employee is still in 'onboarding' status — never affects an active or terminated employee.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
            {
              name: "send_mail",
              in: "query",
              required: false,
              description:
                "If true, sends a rejection notice to the employee before deleting their record.",
              schema: { type: "boolean", default: false },
            },
          ],
          responses: {
            200: {
              description: "Rejected and deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Employee is not a pending applicant",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },

      "/api/leaves": {
        get: {
          tags: ["Leaves"],
          summary: "List leave requests",
          description:
            "Employees see only their own requests; admins/leads see all and may filter by employee_id.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "employee_id", in: "query", schema: { type: "integer" } },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["pending", "approved", "rejected"],
              },
            },
          ],
          responses: {
            200: {
              description: "Array of leave requests",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/LeaveRequest" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Leaves"],
          summary: "Submit a leave request",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "employee_id",
                    "leave_type",
                    "start_date",
                    "end_date",
                  ],
                  properties: {
                    employee_id: { type: "integer" },
                    leave_type: {
                      type: "string",
                      enum: ["sick", "bereavement", "maternity", "paternity"],
                    },
                    start_date: { type: "string", format: "date" },
                    end_date: { type: "string", format: "date" },
                    reason: { type: "string" },
                    to: {
                      type: "string",
                      format: "email",
                      description:
                        "If provided, sends a notification email via the employee's configured SMTP settings",
                    },
                    cc: { type: "string" },
                    bcc: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
          },
        },
      },
      "/api/leaves/{id}": {
        put: {
          tags: ["Leaves"],
          summary: "Edit a pending leave request",
          description:
            'Only the owning employee may edit, and only while status is still "pending".',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeaveUpdateInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Not pending",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not the owner",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
        delete: {
          tags: ["Leaves"],
          summary: "Cancel a pending leave request",
          description:
            'Only the owning employee may cancel, and only while status is still "pending". Permanently deletes the row.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Cancelled",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Not pending",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not the owner",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },
      "/api/leaves/out/today": {
        get: {
          tags: ["Leaves"],
          summary: "Employees on approved leave today",
          responses: {
            200: {
              description: "Array of employees out today",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        designation: { type: "string" },
                        profile_picture: { type: "string", nullable: true },
                        leave_type: { type: "string" },
                        end_date: { type: "string", format: "date" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/leaves/out/week": {
        get: {
          tags: ["Leaves"],
          summary: "Employees on approved leave this week (Mon–Fri)",
          responses: {
            200: {
              description: "Array of employees out this week",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        designation: { type: "string" },
                        leave_type: { type: "string" },
                        start_date: { type: "string", format: "date" },
                        end_date: { type: "string", format: "date" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/leaves/balances/{employeeId}": {
        get: {
          tags: ["Leaves"],
          summary: "Get leave balances for an employee (current year)",
          parameters: [
            {
              name: "employeeId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Balance per leave type",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/LeaveBalance" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/leaves/{id}/approve": {
        put: {
          tags: ["Leaves"],
          summary: "Approve a leave request",
          description:
            "Admin/lead only (leads cannot approve their own request). Deducts the leave days from the employee balance. Fails if the leave's dates have already passed.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { reviewed_by: { type: "integer" } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Approved",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Dates already passed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },
      "/api/leaves/{id}/reject": {
        put: {
          tags: ["Leaves"],
          summary: "Reject a leave request",
          description:
            "Admin/lead only (leads cannot reject their own request). Fails if the leave's dates have already passed.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { reviewed_by: { type: "integer" } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Rejected",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Dates already passed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },

      "/api/standups": {
        get: {
          tags: ["Standups"],
          summary: "List standups",
          description:
            "Employees see only their own standups; admins/leads see all and may filter by employee_id. Capped at 200 rows.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "date",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Exact date filter (YYYY-MM-DD)",
            },
            {
              name: "start_date",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Ignored if `date` is set",
            },
            {
              name: "end_date",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Ignored if `date` is set",
            },
            { name: "employee_id", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            200: {
              description: "Array of standups",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Standup" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Standups"],
          summary: "Submit a standup",
          description:
            "Upserts — submitting again for the same day overwrites the previous entry. Also mirrors the standup to Discord if DISCORD_BOT_URL is configured.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["employee_id", "yesterday", "today"],
                  properties: {
                    employee_id: { type: "integer" },
                    yesterday: { type: "string" },
                    today: { type: "string" },
                    blockers: { type: "string" },
                    standup_date: {
                      type: "string",
                      format: "date",
                      description: "Defaults to today if omitted",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
          },
        },
      },
      "/api/standups/today": {
        get: {
          tags: ["Standups"],
          summary: "All standups submitted today (own only unless admin/lead)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Array of today's standups",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Standup" },
                  },
                },
              },
            },
          },
        },
      },

      "/api/projects/by-employee/{empId}": {
        get: {
          tags: ["Projects"],
          summary:
            "Projects an employee is assigned to (with role and milestones)",
          parameters: [
            {
              name: "empId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Array of projects",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProjectByEmployee" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/projects": {
        get: {
          tags: ["Projects"],
          summary: "List all projects",
          parameters: [
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["active", "archived", "on_hold"],
              },
            },
          ],
          responses: {
            200: {
              description: "Array of projects",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Project" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Projects"],
          summary: "Create a project",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    repo_url: {
                      type: "array",
                      items: { type: "string", format: "uri" },
                    },
                    docs_url: {
                      type: "array",
                      items: { type: "string", format: "uri" },
                    },
                    status: {
                      type: "string",
                      enum: ["active", "archived", "on_hold"],
                      default: "active",
                    },
                    start_date: { type: "string", format: "date" },
                    expected_end_date: { type: "string", format: "date" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
          },
        },
      },
      "/api/projects/{id}": {
        put: {
          tags: ["Projects"],
          summary: "Update project",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Nothing to update",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/projects/{id}/assignments": {
        get: {
          tags: ["Projects"],
          summary: "Get team assignments for a project",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Array of assignments",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Assignment" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Projects"],
          summary: "Assign an employee to a project",
          description:
            "Upserts — re-assigning the same employee updates their role.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["employee_id", "role"],
                  properties: {
                    employee_id: { type: "integer" },
                    role: {
                      type: "string",
                      enum: [
                        "lead",
                        "backend",
                        "frontend",
                        "ui_ux",
                        "qa",
                        "devops",
                      ],
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Assigned",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
          },
        },
      },
      "/api/projects/{id}/assignments/{empId}": {
        delete: {
          tags: ["Projects"],
          summary: "Remove an employee from a project",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
            {
              name: "empId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Removed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
          },
        },
      },
      "/api/projects/{id}/milestones": {
        get: {
          tags: ["Projects"],
          summary: "Get milestones for a project",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Array of milestones",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Milestone" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Projects"],
          summary: "Add a milestone to a project",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "due_date"],
                  properties: {
                    title: { type: "string" },
                    due_date: { type: "string", format: "date" },
                    status: {
                      type: "string",
                      enum: ["pending", "in_progress", "completed"],
                      default: "pending",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
          },
        },
      },
      "/api/projects/{id}/milestones/{mid}": {
        put: {
          tags: ["Projects"],
          summary: "Update a milestone",
          description:
            "Fields are updated only if provided (COALESCE against existing values).",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
            {
              name: "mid",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    due_date: { type: "string", format: "date" },
                    status: {
                      type: "string",
                      enum: ["pending", "in_progress", "completed"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
          },
        },
      },
      "/api/projects/{id}/services": {
        get: {
          tags: ["Projects"],
          summary: "List linked service keys for a project",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Array of service keys",
              content: {
                "application/json": {
                  schema: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        post: {
          tags: ["Projects"],
          summary: "Link a service to a project",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["service_key"],
                  properties: { service_key: { type: "string" } },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Linked (idempotent)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "service_key required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/projects/{id}/services/{serviceKey}": {
        delete: {
          tags: ["Projects"],
          summary: "Unlink a service from a project",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
            {
              name: "serviceKey",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Unlinked",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
          },
        },
      },

      "/api/servers": {
        get: {
          tags: ["Servers"],
          summary: "List servers",
          parameters: [
            { name: "project_id", in: "query", schema: { type: "integer" } },
            {
              name: "show_sensitive",
              in: "query",
              schema: { type: "boolean" },
              description: "Reveal masked sensitive fields (lead/admin only)",
            },
          ],
          responses: {
            200: {
              description: "Array of servers",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Server" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Servers"],
          summary: "Register a server",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "environment"],
                  properties: {
                    project_id: { type: "integer", nullable: true },
                    name: { type: "string" },
                    environment: {
                      type: "string",
                      enum: ["development", "staging", "production"],
                    },
                    ip_address: { type: "string" },
                    domain: { type: "string" },
                    ssh_user: { type: "string" },
                    notes: { type: "string" },
                    is_sensitive: { type: "boolean", default: false },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
          },
        },
      },
      "/api/servers/{id}": {
        put: {
          tags: ["Servers"],
          summary: "Update server details",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Server" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Servers"],
          summary: "Delete a server record",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
          },
        },
      },

      "/api/events": {
        get: {
          tags: ["Events"],
          summary: "List all culture events (latest 50)",
          responses: {
            200: {
              description: "Array of events",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/CultureEvent" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Events"],
          summary: "Create a culture event",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "event_type", "event_date"],
                  properties: {
                    title: { type: "string" },
                    event_type: {
                      type: "string",
                      enum: [
                        "birthday",
                        "anniversary",
                        "team_event",
                        "milestone",
                      ],
                    },
                    employee_id: { type: "integer", nullable: true },
                    event_date: { type: "string", format: "date" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
          },
        },
      },
      "/api/events/upcoming": {
        get: {
          tags: ["Events"],
          summary: "Events in the next 30 days",
          responses: {
            200: {
              description: "Array of upcoming events",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/CultureEvent" },
                  },
                },
              },
            },
          },
        },
      },

      "/api/payroll": {
        get: {
          tags: ["Payroll"],
          summary: "List payroll data",
          description:
            "Admins/leads see all active employees; other roles see only their own record.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Array of payroll records",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PayrollEmployee" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/payroll/{id}/salary": {
        put: {
          tags: ["Payroll"],
          summary: "Update an employee's salary and pay frequency",
          description: "Admin only.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SalaryUpdateInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MessageResponse" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/payroll/{id}/reset-password": {
        put: {
          tags: ["Payroll"],
          summary: "Admin-initiated password reset for an employee",
          description: "Admin only.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AdminPasswordResetInput",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Reset",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MessageResponse" },
                },
              },
            },
            400: {
              description: "Password too short",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/payroll/taxes": {
        get: {
          tags: ["Payroll"],
          summary:
            "List payroll tax profiles with estimated tax computed from salary",
          description:
            "Admins/leads see all active employees; other roles see only their own record. Tax is a simplified estimate based on Nepal's individual/couple income tax slabs (NPR), not a substitute for a real tax engine.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Array of tax records",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PayrollTaxEmployee" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/payroll/{id}/tax-profile": {
        put: {
          tags: ["Payroll"],
          summary: "Create or update an employee's tax profile",
          description: "Admin only. Upserts on employee_id.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TaxProfileInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MessageResponse" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/goals": {
        get: {
          tags: ["Goals"],
          summary: "List goals",
          description:
            "Employees see only their own goals; admins/leads see all and may filter by employee_id.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "employee_id", in: "query", schema: { type: "integer" } },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "not_started",
                  "in_progress",
                  "at_risk",
                  "completed",
                  "missed",
                ],
              },
            },
            {
              name: "category",
              in: "query",
              schema: {
                type: "string",
                enum: ["individual", "team", "company"],
              },
            },
          ],
          responses: {
            200: {
              description: "Array of goals",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Goal" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Goals"],
          summary: "Create a goal",
          description:
            "Employees may only create goals for themselves; admins/leads may assign to anyone.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoalInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/goals/summary": {
        get: {
          tags: ["Goals"],
          summary: "Aggregate goal completion stats per employee",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Array of per-employee summaries",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/GoalSummary" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/goals/{id}": {
        put: {
          tags: ["Goals"],
          summary: "Update a goal's details",
          description: "Owner, or admin/lead.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoalInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
        delete: {
          tags: ["Goals"],
          summary: "Delete a goal",
          description: "Owner, or admin/lead.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },
      "/api/goals/{id}/progress": {
        put: {
          tags: ["Goals"],
          summary: "Update a goal's progress value and status",
          description: "Owner, or admin/lead.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoalProgressInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },

      "/api/performance": {
        get: {
          tags: ["Performance"],
          summary: "List performance reviews",
          description:
            "Employees see only their own reviews; admins/leads see all and may filter by employee_id.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "employee_id", in: "query", schema: { type: "integer" } },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["draft", "submitted", "acknowledged"],
              },
            },
          ],
          responses: {
            200: {
              description: "Array of reviews",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PerformanceReview" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Performance"],
          summary: "Create a draft performance review",
          description:
            "Admin/lead only. review_period must be unique per employee.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PerformanceReviewInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
            400: {
              description: "A review for this period already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/performance/trend/{employeeId}": {
        get: {
          tags: ["Performance"],
          summary:
            "Rating history for an employee across submitted/acknowledged review periods",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "employeeId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Array of rating points",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/RatingTrendPoint" },
                  },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/performance/{id}": {
        put: {
          tags: ["Performance"],
          summary: "Edit a draft review",
          description: 'Admin/lead only, and only while status is "draft".',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PerformanceReviewInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Only draft reviews can be edited",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
        delete: {
          tags: ["Performance"],
          summary: "Delete a draft review",
          description: 'Admin/lead only, and only while status is "draft".',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Only draft reviews can be deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },
      "/api/performance/{id}/submit": {
        put: {
          tags: ["Performance"],
          summary: "Submit a draft review to the employee",
          description: "Admin/lead only.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Submitted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Review has already been submitted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },
      "/api/performance/{id}/acknowledge": {
        put: {
          tags: ["Performance"],
          summary: "Acknowledge a submitted review",
          description:
            'Only the reviewed employee may acknowledge, and only while status is "submitted".',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PerformanceAcknowledgeInput",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Acknowledged",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Only submitted reviews can be acknowledged",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not the reviewed employee",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },

      "/api/feedback": {
        get: {
          tags: ["Feedback"],
          summary: "List feedback notes",
          description:
            "`scope=public` returns the company recognition feed; `scope=received`/`scope=sent` default to the caller's own notes (admins/leads may pass employee_id to view another employee's).",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "scope",
              in: "query",
              schema: {
                type: "string",
                enum: ["public", "received", "sent"],
                default: "public",
              },
            },
            { name: "employee_id", in: "query", schema: { type: "integer" } },
            {
              name: "type",
              in: "query",
              schema: {
                type: "string",
                enum: ["praise", "constructive", "peer", "manager"],
              },
            },
          ],
          responses: {
            200: {
              description: "Array of feedback notes",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/FeedbackNote" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Feedback"],
          summary: "Send a feedback note to another employee",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FeedbackInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
            400: {
              description: "Missing message or sending feedback to yourself",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/feedback/summary": {
        get: {
          tags: ["Feedback"],
          summary:
            "Recognition leaderboard — feedback received counts per employee",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Array of per-employee summaries",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/FeedbackSummary" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/feedback/{id}": {
        delete: {
          tags: ["Feedback"],
          summary: "Delete a feedback note",
          description: "Only the sender, or an admin/lead.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },

      "/api/profile": {
        get: {
          tags: ["Profile"],
          summary: "Get the logged-in employee's profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Profile" },
                },
              },
            },
            404: {
              description: "Not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Profile"],
          summary: "Update editable profile fields",
          description:
            'Setting dob also upserts a "birthday" culture event for the employee.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProfileUpdateInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Nothing to update",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/profile/photo": {
        post: {
          tags: ["Profile"],
          summary: "Upload/replace profile photo",
          description:
            "Multipart upload. Accepts .jpg/.jpeg/.png/.webp up to 5 MB. Deletes the previous photo file.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["photo"],
                  properties: { photo: { type: "string", format: "binary" } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Uploaded",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UploadResponse" },
                },
              },
            },
            400: {
              description: "No file uploaded",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/profile/citizenship/{side}": {
        post: {
          tags: ["Profile"],
          summary: "Upload a citizenship document image (front or back)",
          description:
            "Multipart upload. Accepts .jpg/.jpeg/.png/.webp up to 5 MB. Deletes the previous file for that side.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "side",
              in: "path",
              required: true,
              schema: { type: "string", enum: ["front", "back"] },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["doc"],
                  properties: { doc: { type: "string", format: "binary" } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Uploaded",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UploadResponse" },
                },
              },
            },
            400: {
              description: "Invalid side or no file uploaded",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/reports": {
        get: {
          tags: ["Reports"],
          summary: "List monthly reports",
          description:
            "Admins/leads see all submissions; other roles see only their own.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "month",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 12 },
            },
            { name: "year", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            200: {
              description: "Array of reports",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/MonthlyReport" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Reports"],
          summary: "Submit a monthly report file",
          description:
            "Multipart upload. Accepts .pdf/.pptx/.ppt/.docx/.doc up to 20 MB.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file", "employee_id", "title", "month", "year"],
                  properties: {
                    file: { type: "string", format: "binary" },
                    employee_id: { type: "integer" },
                    title: { type: "string" },
                    month: { type: "integer", minimum: 1, maximum: 12 },
                    year: { type: "integer" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Created" },
                },
              },
            },
            400: {
              description: "Missing required fields or no file",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/reports/{id}/download": {
        get: {
          tags: ["Reports"],
          summary: "Download a report file",
          description:
            "Non-privileged users may only download their own reports.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "File stream",
              content: {
                "application/octet-stream": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            403: {
              description: "Access denied",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/reports/{id}": {
        delete: {
          tags: ["Reports"],
          summary: "Delete a report",
          description:
            "Non-privileged users may only delete their own reports. Also removes the file from disk.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Not the owner",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/google/auth-url": {
        get: {
          tags: ["Google Calendar"],
          summary: "Get the Google OAuth consent URL",
          description: "Admin only.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Auth URL",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/GoogleAuthUrl" },
                },
              },
            },
            500: {
              description: "OAuth client not configured",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/google/callback": {
        get: {
          tags: ["Google Calendar"],
          summary: "OAuth redirect target (called by Google, not the frontend)",
          description:
            "Exchanges the auth code for tokens, stores them, and redirects to the frontend calendar page.",
          parameters: [
            {
              name: "code",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            302: {
              description:
                "Redirect to FRONTEND_URL/calendar with a status query param",
            },
          },
        },
      },
      "/api/google/status": {
        get: {
          tags: ["Google Calendar"],
          summary: "Get Google Calendar connection status",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Status",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/GoogleStatus" },
                },
              },
            },
          },
        },
      },
      "/api/google/disconnect": {
        delete: {
          tags: ["Google Calendar"],
          summary: "Disconnect Google Calendar",
          description:
            "Admin only. Stops the push-notification channel and clears stored tokens.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Disconnected",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            401: {
              description: "Google token revoked",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            503: {
              description: "Google not connected",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/google/sync": {
        post: {
          tags: ["Google Calendar"],
          summary:
            "Manually sync upcoming Google Calendar events into meetings",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Sync result",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/GoogleSyncResult" },
                },
              },
            },
            401: {
              description: "Google token revoked",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            503: {
              description: "Google not connected",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/google/webhook": {
        post: {
          tags: ["Google Calendar"],
          summary: "Google Calendar push-notification receiver",
          description:
            "Called by Google, not the frontend. No auth — responds 200 immediately, then syncs in the background.",
          parameters: [
            {
              name: "x-goog-resource-state",
              in: "header",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Acknowledged" },
          },
        },
      },

      "/api/google/meetings": {
        get: {
          tags: ["Meetings"],
          summary: "List scheduled meetings from the last 7 days onward",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Array of meetings",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Meeting" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Meetings"],
          summary: "Create a meeting",
          description:
            "Also creates a matching Google Calendar event with a Meet link.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeetingInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MeetingCreated" },
                },
              },
            },
            400: {
              description: "Missing required fields",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            502: {
              description: "Google Calendar error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/google/meetings/{id}": {
        delete: {
          tags: ["Meetings"],
          summary: "Cancel a meeting",
          description:
            "Only the creator or an admin may cancel. Soft-delete (sets status = cancelled).",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Cancelled",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Not authorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/discord/standup": {
        post: {
          tags: ["Discord"],
          summary: "Discord Webhook Events / Interactions endpoint",
          description:
            "Handles Discord PING handshakes and the /standup slash command. Requires a valid Ed25519 signature (X-Signature-Ed25519 / X-Signature-Timestamp headers) verified against DISCORD_PUBLIC_KEY.",
          parameters: [
            {
              name: "X-Signature-Ed25519",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "X-Signature-Timestamp",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Raw Discord interaction payload",
                },
              },
            },
          },
          responses: {
            200: {
              description:
                "Interaction response (PING ack or slash-command reply)",
            },
            204: { description: "Acknowledged, no content" },
            401: { description: "Missing or invalid signature" },
            500: { description: "DISCORD_PUBLIC_KEY not configured" },
          },
        },
      },
      "/api/discord/standup-submit": {
        post: {
          tags: ["Discord"],
          summary:
            "Internal endpoint used by the discord.js bot to record a confirmed standup",
          description:
            "Protected by a shared secret header instead of a Discord signature.",
          parameters: [
            {
              name: "X-Internal-Token",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["discordName", "yesterday", "today"],
                  properties: {
                    discordName: { type: "string" },
                    yesterday: { type: "string" },
                    today: { type: "string" },
                    blockers: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Saved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      employee: { type: "string" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Missing required fields",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            401: {
              description: "Wrong internal token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "No employee matched discordName",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/email-settings/{employeeId}": {
        get: {
          tags: ["Email Settings"],
          summary: "Get SMTP settings for an employee",
          description: "Never returns the stored password.",
          parameters: [
            {
              name: "employeeId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Settings (or null if not configured)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/EmailSettings" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Email Settings"],
          summary: "Create or update SMTP settings for an employee",
          description:
            "smtp_pass is required on first save; omit it on later updates to keep the existing password. Test-verifies the SMTP connection asynchronously when a password is provided.",
          parameters: [
            {
              name: "employeeId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EmailSettingsInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Saved",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "Missing required fields",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/service-credentials/{employeeId}": {
        get: {
          tags: ["Service Credentials"],
          summary: "List an employee's stored service credentials",
          description: "Never returns stored passwords.",
          parameters: [
            {
              name: "employeeId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Array of credentials",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ServiceCredential" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Service Credentials"],
          summary: "Create or update a service credential",
          description:
            "Upserts on (employee_id, service_name). Password is left unchanged if omitted/blank.",
          parameters: [
            {
              name: "employeeId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ServiceCredentialInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Saved",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            400: {
              description: "service_name required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/webhooks/{service}": {
        get: {
          tags: ["Webhooks"],
          summary: "Verification handshake (Meta/WhatsApp-style)",
          description:
            "Echoes hub.challenge after optionally checking hub.verify_token against WEBHOOK_VERIFY_TOKEN_<SERVICE> in env.",
          parameters: [
            {
              name: "service",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Labels the sender in logs",
            },
            { name: "hub.mode", in: "query", schema: { type: "string" } },
            {
              name: "hub.verify_token",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "hub.challenge",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Challenge echoed back as plain text" },
            400: { description: "Missing hub.challenge" },
            403: { description: "Verify token mismatch" },
          },
        },
        post: {
          tags: ["Webhooks"],
          summary: "Receive an event payload from an external service",
          description:
            'Also handles Slack-style POST verification ({ type: "url_verification", challenge }). Always acknowledges with 200 immediately; processing happens after the response.',
          parameters: [
            {
              name: "service",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description:
                    "Arbitrary event payload, or a Slack url_verification challenge",
                },
              },
            },
          },
          responses: {
            200: {
              description:
                "Acknowledged (or challenge echoed for Slack verification)",
            },
          },
        },
      },
      "/month-end-report": {
        get: {
          tags: ["Webhooks"],
          summary: "Endpoint for n8n workflow to call on month end.",
          description: "Endpoint for n8n workflow to call on month end.",
          responses: {
            200: { description: "sucessfully send data to n8n webhook" },
            502: { description: "n8n webhook returned an error" },
            503: { description: "Error in sending request to n8n workflow" },
          },
        },
      },
      "/api/form-layout": {
        get: {
          tags: ["FormLayout"],
          summary: "Get the onboarding form layout",
          parameters: [
            {
              name: "type",
              in: "query",
              schema: { type: "string", enum: ["intern", "employee"] },
              description: "Which onboarding form layout to fetch",
            },
          ],
          responses: {
            200: {
              description: "Form layout grouped by section",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FormLayoutResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["FormLayout"],
          summary: "Set the onboarding form layout",
          description: "Admin/lead only.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FormLayoutResponse" },
              },
            },
          },
          responses: {
            200: {
              description: "Layout saved",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/onboard": {
        get: {
          tags: ["Onboard"],
          summary: "List onboarding profiles",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "type",
              in: "query",
              schema: { type: "string", enum: ["all", "intern", "employee"] },
            },
          ],
          responses: {
            200: {
              description: "Array of onboarding profiles",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/OnboardProfile" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Onboard"],
          summary: "Submit an onboarding application with signed contract",
          description:
            "Public endpoint. Multipart upload — accepts .pdf/.doc/.docx up to 10 MB.",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["payload", "contract"],
                  properties: {
                    payload: {
                      type: "string",
                      description: "JSON-stringified onboarding form fields",
                    },
                    contract: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Onboarding data added successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MessageResponse" },
                },
              },
            },
            400: {
              description: "Missing contract or validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/onboard/{id}/approve": {
        patch: {
          tags: ["Onboard"],
          summary: "Approve an onboarding profile",
          description: "Lead/admin only.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Approved",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },
      "/api/onboard/{id}": {
        delete: {
          tags: ["Onboard"],
          summary: "Disapprove/remove an onboarding profile",
          description: "Lead/admin only.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Removed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Success" },
                },
              },
            },
            403: {
              description: "Insufficient permissions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      },
      "/api/onboard/{id}/contract": {
        get: {
          tags: ["Onboard"],
          summary: "View the uploaded contract file for an onboarding profile",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Contract file stream",
              content: {
                "application/pdf": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            404: {
              description: "Contract not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};

export default swaggerJsdoc(options);
