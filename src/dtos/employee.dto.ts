import { z } from 'zod';

const UPDATE_FIELDS = [
  'name', 'phone', 'secondary_email', 'discord_username', 'emergency_contact', 'designation',
  'department', 'manager_id', 'timezone', 'work_hours', 'tech_stack', 'role',
] as const;

// Matches the `employee_auth.role` ENUM in schema.sql.
const ROLES = ['admin', 'lead', 'employee'] as const;

const emailField = z.string().trim().email('must be a valid email address');

// Every field below is optional at the schema level — required-ness (name/email on
// create) is enforced separately, same as the original hand-written check, so the
// error message/shape for a missing name/email stays exactly what callers expect.
const fieldSchemas = {
  name: z.string().trim().min(1),
  email: emailField,
  secondary_email: emailField.nullable(),
  phone: z.string().trim().nullable(),
  discord_username: z.string().trim().nullable(),
  emergency_contact: z.string().trim().nullable(),
  designation: z.string().trim().nullable(),
  department: z.string().trim().nullable(),
  manager_id: z.coerce.number().int().positive().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format').nullable(),
  timezone: z.string().trim().min(1),
  work_hours: z.string().trim().min(1),
  tech_stack: z.array(z.string()),
  role: z.enum(ROLES),
} as const;

type FieldName = keyof typeof fieldSchemas;

function validateField(field: FieldName, value: unknown) {
  if (value === undefined || value === null) return; // null/undefined allowed — defaulted or nullable below
  const schema = fieldSchemas[field];
  if (!schema) return;
  const result = schema.safeParse(value);
  if (!result.success) {
    const err: any = new Error(`${field}: ${result.error.issues[0].message}`);
    err.status = 400;
    throw err;
  }
}

// "Interface" types for the service/controller layer — the request/response shapes.
export interface EmployeeCreateInput {
  name: string;
  email: string;
  secondary_email: string | null;
  phone: string | null;
  emergency_contact: string | null;
  designation: string | null;
  department: string | null;
  manager_id: number | null;
  start_date: string | null;
  timezone: string;
  work_hours: string;
  tech_stack: string[];
  role: (typeof ROLES)[number];
}

export type EmployeeUpdateInput = Partial<Pick<EmployeeCreateInput,
  'name' | 'phone' | 'secondary_email' | 'designation' | 'department' | 'manager_id' | 'timezone' | 'work_hours' | 'tech_stack' | 'role'
>> & { discord_username?: string | null; emergency_contact?: string | null };

export interface EmployeeResponse {
  id: number;
  name: string;
  email: string;
  [key: string]: unknown;
}

export function toCreateInput(body: Record<string, any>): EmployeeCreateInput {
  if (!body.name || !body.email) {
    const err: any = new Error('name and email are required');
    err.status = 400;
    throw err;
  }

  validateField('name', body.name);
  validateField('email', body.email);
  validateField('secondary_email', body.secondary_email);
  validateField('phone', body.phone);
  validateField('emergency_contact', body.emergency_contact);
  validateField('designation', body.designation);
  validateField('department', body.department);
  validateField('manager_id', body.manager_id);
  validateField('start_date', body.start_date);
  validateField('timezone', body.timezone);
  validateField('work_hours', body.work_hours);
  validateField('tech_stack', body.tech_stack);
  validateField('role', body.role);

  return {
    name: body.name,
    email: body.email,
    secondary_email: body.secondary_email || null,
    phone: body.phone || null,
    emergency_contact: body.emergency_contact || null,
    designation: body.designation || null,
    department: body.department || null,
    manager_id: body.manager_id || null,
    start_date: body.start_date || null,
    timezone: body.timezone || 'UTC',
    work_hours: body.work_hours || '9 AM - 5 PM',
    tech_stack: body.tech_stack || [],
    role: body.role || 'employee',
  };
}

export function toUpdateInput(body: Record<string, any>): EmployeeUpdateInput {
  const updates: Record<string, any> = {};
  UPDATE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) {
      validateField(f, body[f]);
      updates[f] = body[f];
    }
  });
  return updates;
}

// Strip fields that should never reach the client (password_hash).
export function toResponse(employee: Record<string, any> | null): EmployeeResponse | null {
  if (!employee) return null;
  const { password_hash, ...safe } = employee;
  return safe as EmployeeResponse;
}

export function toResponseList(employees: Record<string, any>[]): EmployeeResponse[] {
  return employees.map((e) => toResponse(e) as EmployeeResponse);
}
