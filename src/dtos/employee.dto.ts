import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const ROLES = ['admin', 'lead', 'employee', 'intern'] as const;
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

const emailField = z.string().trim().email('must be a valid email address');
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');
const urlField = z.string().trim().url('must be a valid URL');

const employeeFields = {
  name: z.string().trim().min(1),
  email: emailField,
  secondary_email: emailField.nullable(),
  discord_username: z.string().trim().nullable(),
  designation: z.string().trim().nullable(),
  department: z.string().trim().nullable(),
  manager_id: z.coerce.number().int().positive().nullable(),
  start_date: dateField.nullable(),
  role: z.enum(ROLES),
  status: z.enum(['onboarding', 'active']),
  gender: z.enum(GENDERS).nullable(),
  dob: dateField.nullable(),
  address: z.string().trim().nullable(),
  panNo: z.string().trim().nullable(),
  github_url: urlField.nullable(),
  education_level: z.string().trim().nullable(),
  institution_name: z.string().trim().nullable(),
  field_of_study: z.string().trim().nullable(),
  graduation_date: dateField.nullable(),
  previous_experience: z.string().trim().nullable(),
  areas_of_interest: z.string().trim().nullable(),
  linkedin_url: urlField.nullable(),
  portfolio_url: urlField.nullable(),
};

const ONBOARDING_FIELDS = {
  gender: optionalNullable(employeeFields.gender),
  education_level: optionalNullable(employeeFields.education_level),
  institution_name: optionalNullable(employeeFields.institution_name),
  field_of_study: optionalNullable(employeeFields.field_of_study),
  graduation_date: optionalNullable(employeeFields.graduation_date),
  previous_experience: optionalNullable(employeeFields.previous_experience),
  areas_of_interest: optionalNullable(employeeFields.areas_of_interest),
  linkedin_url: optionalNullable(employeeFields.linkedin_url),
  portfolio_url: optionalNullable(employeeFields.portfolio_url),
};

const createBodySchema = z.object({
  name: employeeFields.name,
  email: employeeFields.email,
  secondary_email: optionalNullable(employeeFields.secondary_email),
  discord_username: optionalNullable(employeeFields.discord_username),
  designation: optionalNullable(employeeFields.designation),
  department: optionalNullable(employeeFields.department),
  manager_id: optionalNullable(employeeFields.manager_id),
  start_date: optionalNullable(employeeFields.start_date),
  role: optionalNullable(employeeFields.role),
  status: optionalNullable(employeeFields.status),
  dob: optionalNullable(employeeFields.dob),
  address: optionalNullable(employeeFields.address),
  panNo: optionalNullable(employeeFields.panNo),
  github_url: optionalNullable(employeeFields.github_url),
  ...ONBOARDING_FIELDS,
});

const updateBodySchema = z.object({
  name: optionalNullable(employeeFields.name),
  secondary_email: optionalNullable(employeeFields.secondary_email),
  discord_username: optionalNullable(employeeFields.discord_username),
  designation: optionalNullable(employeeFields.designation),
  department: optionalNullable(employeeFields.department),
  manager_id: optionalNullable(employeeFields.manager_id),
  start_date: optionalNullable(employeeFields.start_date),
  role: optionalNullable(employeeFields.role),
  dob: optionalNullable(employeeFields.dob),
  address: optionalNullable(employeeFields.address),
  panNo: optionalNullable(employeeFields.panNo),
  github_url: optionalNullable(employeeFields.github_url),
  ...ONBOARDING_FIELDS,
});
const UPDATE_FIELD_NAMES = Object.keys(updateBodySchema.shape) as (keyof EmployeeUpdateInput)[];

export interface OnboardingProfileFields {
  gender: (typeof GENDERS)[number] | null;
  education_level: string | null;
  institution_name: string | null;
  field_of_study: string | null;
  graduation_date: string | null;
  previous_experience: string | null;
  areas_of_interest: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
}

export interface EmployeeCreateInput extends OnboardingProfileFields {
  name: string;
  email: string;
  secondary_email: string | null;
  discord_username: string | null;
  designation: string | null;
  department: string | null;
  manager_id: number | null;
  start_date: string | null;
  role: (typeof ROLES)[number];
  status: 'onboarding' | 'active';
  dob: string | null;
  address: string | null;
  panNo: string | null;
  github_url: string | null;
}

export interface EmployeeUpdateInput extends Partial<OnboardingProfileFields> {
  name?: string;
  secondary_email?: string | null;
  discord_username?: string | null;
  designation?: string | null;
  department?: string | null;
  manager_id?: number | null;
  start_date?: string | null;
  role?: (typeof ROLES)[number];
  dob?: string | null;
  address?: string | null;
  panNo?: string | null;
  github_url?: string | null;
}

export interface EmployeeResponse extends OnboardingProfileFields {
  id: number;
  name: string;
  email: string;
  secondary_email: string | null;
  discord_username: string | null;
  dob: string | null;
  address: string | null;
  panNo: string | null;
  profile_picture: string | null;
  citizenship_front: string | null;
  citizenship_back: string | null;
  designation: string | null;
  designation_id: number | null;
  department: string | null;
  department_id: number | null;
  manager_id: number | null;
  manager_name: string | null;
  start_date: string | null;
  role: (typeof ROLES)[number] | null;
  salary: string | null;
  pay_frequency: 'monthly' | 'biweekly' | 'weekly' | null;
  status: string | null;
}

export function toCreateInput(body: unknown): EmployeeCreateInput {
  const b = body as Record<string, any>;
  if (!b?.name || !b?.email) {
    throw new AppError('name and email are required', 400);
  }
  const parsed = bindAndValidate(createBodySchema, body);

  return {
    name: parsed.name,
    email: parsed.email,
    secondary_email: parsed.secondary_email || null,
    discord_username: parsed.discord_username || null,
    designation: parsed.designation || null,
    department: parsed.department || null,
    manager_id: parsed.manager_id || null,
    start_date: parsed.start_date || null,
    role: parsed.role || 'employee',
    status: parsed.status || 'active',
    dob: parsed.dob || null,
    address: parsed.address || null,
    panNo: parsed.panNo || null,
    github_url: parsed.github_url || null,
    gender: parsed.gender || null,
    education_level: parsed.education_level || null,
    institution_name: parsed.institution_name || null,
    field_of_study: parsed.field_of_study || null,
    graduation_date: parsed.graduation_date || null,
    previous_experience: parsed.previous_experience || null,
    areas_of_interest: parsed.areas_of_interest || null,
    linkedin_url: parsed.linkedin_url || null,
    portfolio_url: parsed.portfolio_url || null,
  };
}

export function toUpdateInput(body: unknown): EmployeeUpdateInput {
  const parsed = bindAndValidate(updateBodySchema, body);
  const b = body as Record<string, any>;
  const updates: EmployeeUpdateInput = {};
  UPDATE_FIELD_NAMES.forEach((f) => {
    if (b[f] !== undefined) (updates as any)[f] = parsed[f];
  });
  return updates;
}

export type EmployeeRow = EmployeeResponse & { password_hash: string | null };

export function toResponse(employee: EmployeeRow | null): EmployeeResponse | null {
  if (!employee) return null;
  const { password_hash, ...safe } = employee;
  return safe;
}

export function toResponseList(employees: EmployeeRow[]): EmployeeResponse[] {
  return employees.map((e) => toResponse(e) as EmployeeResponse);
}
