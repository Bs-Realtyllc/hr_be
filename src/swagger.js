const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HR Platform API',
      version: '1.0.0',
      description: 'Internal HR management platform — leaves, standups, employees, projects, servers, and culture events.',
    },
    servers: [{ url: 'http://localhost:6002', description: 'Local development' }],
    tags: [
      { name: 'Employees', description: 'Employee profiles and directory' },
      { name: 'Leaves', description: 'Leave requests and balances' },
      { name: 'Standups', description: 'Async daily standup feed' },
      { name: 'Projects', description: 'Projects, assignments, and milestones' },
      { name: 'Servers', description: 'Server and environment configs' },
      { name: 'Events', description: 'Culture events — birthdays, anniversaries, milestones' },
    ],
    components: {
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane@company.com' },
            phone: { type: 'string', example: '+977 98XXXXXXXX' },
            emergency_contact: { type: 'string' },
            designation: { type: 'string', example: 'Senior Backend Engineer' },
            department: { type: 'string', example: 'Engineering' },
            manager_id: { type: 'integer', nullable: true },
            manager_name: { type: 'string', nullable: true },
            start_date: { type: 'string', format: 'date', example: '2023-01-15' },
            timezone: { type: 'string', example: 'Asia/Kathmandu' },
            work_hours: { type: 'string', example: '9 AM - 5 PM' },
            tech_stack: { type: 'array', items: { type: 'string' }, example: ['Go', 'React', 'MySQL'] },
            role: { type: 'string', enum: ['admin', 'lead', 'employee'], example: 'employee' },
            is_active: { type: 'boolean' },
          },
        },
        EmployeeInput: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            emergency_contact: { type: 'string' },
            designation: { type: 'string' },
            department: { type: 'string' },
            manager_id: { type: 'integer', nullable: true },
            start_date: { type: 'string', format: 'date' },
            timezone: { type: 'string', default: 'UTC' },
            work_hours: { type: 'string', default: '9 AM - 5 PM' },
            tech_stack: { type: 'array', items: { type: 'string' } },
            role: { type: 'string', enum: ['admin', 'lead', 'employee'], default: 'employee' },
          },
        },
        LeaveRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employee_id: { type: 'integer' },
            employee_name: { type: 'string' },
            designation: { type: 'string' },
            leave_type: { type: 'string', enum: ['casual', 'sick', 'annual'] },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            reason: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            reviewer_name: { type: 'string', nullable: true },
            reviewed_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        LeaveBalance: {
          type: 'object',
          properties: {
            leave_type: { type: 'string', enum: ['casual', 'sick', 'annual'] },
            total: { type: 'integer' },
            taken: { type: 'integer' },
            remaining: { type: 'integer' },
            year: { type: 'integer' },
          },
        },
        Standup: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employee_id: { type: 'integer' },
            employee_name: { type: 'string' },
            designation: { type: 'string' },
            yesterday: { type: 'string' },
            today: { type: 'string' },
            blockers: { type: 'string', nullable: true },
            standup_date: { type: 'string', format: 'date' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Gitgi Platform' },
            description: { type: 'string' },
            repo_url: { type: 'string', format: 'uri', nullable: true },
            docs_url: { type: 'string', format: 'uri', nullable: true },
            status: { type: 'string', enum: ['active', 'archived', 'on_hold'] },
            start_date: { type: 'string', format: 'date', nullable: true },
            expected_end_date: { type: 'string', format: 'date', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Milestone: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            project_id: { type: 'integer' },
            title: { type: 'string' },
            due_date: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          },
        },
        Assignment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            project_id: { type: 'integer' },
            employee_id: { type: 'integer' },
            name: { type: 'string' },
            designation: { type: 'string' },
            role: { type: 'string', enum: ['lead', 'backend', 'frontend', 'ui_ux', 'qa', 'devops'] },
            timezone: { type: 'string' },
          },
        },
        Server: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            project_id: { type: 'integer', nullable: true },
            project_name: { type: 'string', nullable: true },
            name: { type: 'string', example: 'prod-api-01' },
            environment: { type: 'string', enum: ['development', 'staging', 'production'] },
            ip_address: { type: 'string', example: '192.168.1.10' },
            domain: { type: 'string', example: 'api.company.com', nullable: true },
            ssh_user: { type: 'string', example: 'deploy' },
            notes: { type: 'string', nullable: true },
            is_sensitive: { type: 'boolean' },
          },
        },
        CultureEvent: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string', example: "Jane's Birthday" },
            event_type: { type: 'string', enum: ['birthday', 'anniversary', 'team_event', 'milestone'] },
            employee_id: { type: 'integer', nullable: true },
            employee_name: { type: 'string', nullable: true },
            event_date: { type: 'string', format: 'date' },
            description: { type: 'string', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        Created: {
          type: 'object',
          properties: { id: { type: 'integer' } },
        },
        Success: {
          type: 'object',
          properties: { success: { type: 'boolean', example: true } },
        },
      },
    },
    paths: {
      // ── Health ──────────────────────────────────────────────────────────
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            200: { description: 'Server is up', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string' } } } } } },
          },
        },
      },

      // ── Employees ────────────────────────────────────────────────────────
      '/api/employees': {
        get: {
          tags: ['Employees'],
          summary: 'List all active employees',
          responses: {
            200: { description: 'Array of employees', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Employee' } } } } },
          },
        },
        post: {
          tags: ['Employees'],
          summary: 'Create a new employee',
          description: 'Also seeds default leave balances (casual 12, sick 10, annual 15) for the current year.',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeInput' } } } },
          responses: {
            201: { description: 'Employee created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Created' } } } },
            500: { description: 'DB error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/employees/{id}': {
        get: {
          tags: ['Employees'],
          summary: 'Get employee by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Employee', content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } },
            404: { description: 'Not found' },
          },
        },
        put: {
          tags: ['Employees'],
          summary: 'Update employee fields',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeInput' } } } },
          responses: {
            200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
        delete: {
          tags: ['Employees'],
          summary: 'Soft-delete employee (sets is_active = false)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Deactivated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
      },

      // ── Leaves ───────────────────────────────────────────────────────────
      '/api/leaves': {
        get: {
          tags: ['Leaves'],
          summary: 'List leave requests',
          parameters: [
            { name: 'employee_id', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
          ],
          responses: {
            200: { description: 'Array of leave requests', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LeaveRequest' } } } } },
          },
        },
        post: {
          tags: ['Leaves'],
          summary: 'Submit a leave request',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['employee_id', 'leave_type', 'start_date', 'end_date'],
                  properties: {
                    employee_id: { type: 'integer' },
                    leave_type: { type: 'string', enum: ['casual', 'sick', 'annual'] },
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' },
                    reason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Created' } } } },
          },
        },
      },
      '/api/leaves/out/today': {
        get: {
          tags: ['Leaves'],
          summary: 'Employees on approved leave today',
          responses: {
            200: { description: 'Array of employees out today', content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, designation: { type: 'string' }, leave_type: { type: 'string' }, end_date: { type: 'string', format: 'date' } } } } } } },
          },
        },
      },
      '/api/leaves/out/week': {
        get: {
          tags: ['Leaves'],
          summary: 'Employees on approved leave this week',
          responses: {
            200: { description: 'Array of employees out this week' },
          },
        },
      },
      '/api/leaves/balances/{employeeId}': {
        get: {
          tags: ['Leaves'],
          summary: 'Get leave balances for an employee (current year)',
          parameters: [{ name: 'employeeId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Balance per leave type', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LeaveBalance' } } } } },
          },
        },
      },
      '/api/leaves/{id}/approve': {
        put: {
          tags: ['Leaves'],
          summary: 'Approve a leave request',
          description: 'Automatically deducts the leave days from the employee balance.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reviewed_by: { type: 'integer' } } } } } },
          responses: {
            200: { description: 'Approved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
            404: { description: 'Not found' },
          },
        },
      },
      '/api/leaves/{id}/reject': {
        put: {
          tags: ['Leaves'],
          summary: 'Reject a leave request',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reviewed_by: { type: 'integer' } } } } } },
          responses: {
            200: { description: 'Rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
      },

      // ── Standups ─────────────────────────────────────────────────────────
      '/api/standups': {
        get: {
          tags: ['Standups'],
          summary: 'List standups',
          parameters: [
            { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter by specific date (YYYY-MM-DD)' },
            { name: 'employee_id', in: 'query', schema: { type: 'integer' } },
          ],
          responses: {
            200: { description: 'Array of standups', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Standup' } } } } },
          },
        },
        post: {
          tags: ['Standups'],
          summary: 'Submit a standup',
          description: 'Upserts — submitting again for the same day overwrites the previous entry.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['employee_id', 'yesterday', 'today'],
                  properties: {
                    employee_id: { type: 'integer' },
                    yesterday: { type: 'string' },
                    today: { type: 'string' },
                    blockers: { type: 'string' },
                    standup_date: { type: 'string', format: 'date', description: 'Defaults to today if omitted' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Created' } } } },
          },
        },
      },
      '/api/standups/today': {
        get: {
          tags: ['Standups'],
          summary: "All standups submitted today",
          responses: {
            200: { description: 'Array of today\'s standups', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Standup' } } } } },
          },
        },
      },

      // ── Projects ─────────────────────────────────────────────────────────
      '/api/projects': {
        get: {
          tags: ['Projects'],
          summary: 'List all projects',
          parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'archived', 'on_hold'] } }],
          responses: {
            200: { description: 'Array of projects', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } },
          },
        },
        post: {
          tags: ['Projects'],
          summary: 'Create a project',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    repo_url: { type: 'string', format: 'uri' },
                    docs_url: { type: 'string', format: 'uri' },
                    status: { type: 'string', enum: ['active', 'archived', 'on_hold'], default: 'active' },
                    start_date: { type: 'string', format: 'date' },
                    expected_end_date: { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Created' } } } },
          },
        },
      },
      '/api/projects/{id}': {
        put: {
          tags: ['Projects'],
          summary: 'Update project',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          responses: {
            200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
      },
      '/api/projects/{id}/assignments': {
        get: {
          tags: ['Projects'],
          summary: 'Get team assignments for a project',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Array of assignments', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Assignment' } } } } },
          },
        },
        post: {
          tags: ['Projects'],
          summary: 'Assign an employee to a project',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['employee_id', 'role'],
                  properties: {
                    employee_id: { type: 'integer' },
                    role: { type: 'string', enum: ['lead', 'backend', 'frontend', 'ui_ux', 'qa', 'devops'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Assigned', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
      },
      '/api/projects/{id}/assignments/{empId}': {
        delete: {
          tags: ['Projects'],
          summary: 'Remove an employee from a project',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'empId', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            200: { description: 'Removed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
      },
      '/api/projects/{id}/milestones': {
        get: {
          tags: ['Projects'],
          summary: 'Get milestones for a project',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Array of milestones', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Milestone' } } } } },
          },
        },
        post: {
          tags: ['Projects'],
          summary: 'Add a milestone to a project',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'due_date'],
                  properties: {
                    title: { type: 'string' },
                    due_date: { type: 'string', format: 'date' },
                    status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Created' } } } },
          },
        },
      },
      '/api/projects/{id}/milestones/{mid}': {
        put: {
          tags: ['Projects'],
          summary: 'Update a milestone',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'mid', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    due_date: { type: 'string', format: 'date' },
                    status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
      },

      // ── Servers ──────────────────────────────────────────────────────────
      '/api/servers': {
        get: {
          tags: ['Servers'],
          summary: 'List servers',
          parameters: [
            { name: 'project_id', in: 'query', schema: { type: 'integer' } },
            { name: 'show_sensitive', in: 'query', schema: { type: 'boolean' }, description: 'Reveal masked sensitive fields (lead/admin only)' },
          ],
          responses: {
            200: { description: 'Array of servers', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Server' } } } } },
          },
        },
        post: {
          tags: ['Servers'],
          summary: 'Register a server',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'environment'],
                  properties: {
                    project_id: { type: 'integer', nullable: true },
                    name: { type: 'string' },
                    environment: { type: 'string', enum: ['development', 'staging', 'production'] },
                    ip_address: { type: 'string' },
                    domain: { type: 'string' },
                    ssh_user: { type: 'string' },
                    notes: { type: 'string' },
                    is_sensitive: { type: 'boolean', default: false },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Created' } } } },
          },
        },
      },
      '/api/servers/{id}': {
        put: {
          tags: ['Servers'],
          summary: 'Update server details',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Server' } } } },
          responses: {
            200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
        delete: {
          tags: ['Servers'],
          summary: 'Delete a server record',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          },
        },
      },

      // ── Events ───────────────────────────────────────────────────────────
      '/api/events': {
        get: {
          tags: ['Events'],
          summary: 'List all culture events (latest 50)',
          responses: {
            200: { description: 'Array of events', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/CultureEvent' } } } } },
          },
        },
        post: {
          tags: ['Events'],
          summary: 'Create a culture event',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'event_type', 'event_date'],
                  properties: {
                    title: { type: 'string' },
                    event_type: { type: 'string', enum: ['birthday', 'anniversary', 'team_event', 'milestone'] },
                    employee_id: { type: 'integer', nullable: true },
                    event_date: { type: 'string', format: 'date' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Created' } } } },
          },
        },
      },
      '/api/events/upcoming': {
        get: {
          tags: ['Events'],
          summary: 'Events in the next 30 days',
          responses: {
            200: { description: 'Array of upcoming events', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/CultureEvent' } } } } },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
