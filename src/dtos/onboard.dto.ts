import { z } from 'zod';
import { bindAndValidate } from '../pkg/validation';
import AppError from '../pkg/AppError';
import type { OnboardFileField } from '../middleware/uplod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format');

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

// "" / null / missing all collapse to null for optional free-text fields
const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .nullish()
    .transform((v) => (v ? v : null));

const emailField = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .toLowerCase()
    .pipe(z.email(`${label} must be a valid email address`).max(150));

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'] as const;
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

/**
 * JSON sent in the multipart `payload` field by the /onboard/:role form
 * (hr_fe: src/app/onboard/[value]/(intern)/_context/InternOnboardingContext.tsx → buildPayload).
 */
const createPayloadSchema = z.object({
  role: z.enum(['intern', 'employee'], { error: "role must be 'intern' or 'employee'" }),
  personalInfo: z.object(
    {
      name: requiredText('Name', 100),
      dob: dateString,
      gender: z.enum(GENDERS, { error: 'Select a valid gender' }),
      nationality: requiredText('Nationality', 50),
      email: emailField('Email'),
      phone: requiredText('Phone', 20),
      currentAddress: requiredText('Current address', 255),
      permanentAddress: requiredText('Permanent address', 255),
    },
    { error: 'personalInfo is required' },
  ),
  employmentInfo: z.object(
    {
      jobTitle: requiredText('Job title', 100),
      department: requiredText('Department', 50),
      startDate: dateString,
      reportingManager: optionalText('Reporting manager', 100),
      employmentType: z.enum(EMPLOYMENT_TYPES, { error: 'Select a valid employment type' }),
      workLocation: requiredText('Work location', 100),
    },
    { error: 'employmentInfo is required' },
  ),
  emergencyContact: z.object(
    {
      fullName: requiredText('Emergency contact name', 150),
      relationship: requiredText('Emergency contact relationship', 30),
      phone: requiredText('Emergency contact phone', 20),
      email: z
        .union([z.literal(''), emailField('Emergency contact email')])
        .nullish()
        .transform((v) => (v ? v : null)),
      address: optionalText('Emergency contact address', 255),
    },
    { error: 'emergencyContact is required' },
  ),
  confirmed: z.literal(true, { error: 'You must confirm the information is accurate before submitting' }),
});

export type OnboardCreateInput = z.infer<typeof createPayloadSchema>;

/** Relative path ("uploads/...") of each uploaded document, keyed by its form field. */
export type OnboardFilePaths = Partial<Record<OnboardFileField, string>>;

/** Parses and validates the multipart `payload` field (a JSON string). */
export function toCreateInput(rawPayload: unknown): OnboardCreateInput {
  let parsed: unknown = rawPayload;
  if (typeof rawPayload === 'string') {
    try {
      parsed = JSON.parse(rawPayload);
    } catch {
      throw new AppError('payload must be valid JSON', 400);
    }
  }
  if (parsed == null || typeof parsed !== 'object') {
    throw new AppError('payload is required', 400);
  }
  return bindAndValidate(createPayloadSchema, parsed);
}
