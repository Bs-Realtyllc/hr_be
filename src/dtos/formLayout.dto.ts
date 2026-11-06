import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate } from '../pkg/validation';
import type { FormFieldConfig } from '../../drizzle/schema';

export const FORM_LAYOUT_TYPES = ['intern', 'employee'] as const;
export type FormLayoutType = (typeof FORM_LAYOUT_TYPES)[number];

/**
 * Fields each onboarding section may toggle. Names mirror the
 * employee_onboarding_profile columns (or the entry keys of its
 * education_info / previous_experience_info JSON columns) in camelCase —
 * the same names the onboard-form-layout page sends.
 *
 * name, email and role are omitted on purpose: they're NOT NULL in the DB, so
 * they're always collected and can't be toggled off.
 */
export const SECTION_FIELDS = {
  personal: [
    'dob', 'gender', 'nationality', 'phone', 'currentAddress', 'permanentAddress',
    'linkedinUrl', 'githubUrl', 'portfolioUrl',
  ],
  educational: [
    'educationLevel', 'institutionName', 'fieldOfStudy', 'stillEnrolled',
    'graduationDate', 'certificate',
  ],
  experience: [
    'company', 'role', 'startDate', 'endDate', 'stillWorking', 'employmentType',
    'workLocation', 'description', 'experienceLetter',
  ],
  emergency: [
    'emergencyContactName', 'emergencyContactRelation', 'emergencyContactPhone',
    'emergencyContactEmail', 'emergencyContactAddress',
  ],
  documents: [
    'photoPath', 'idFrontPath', 'idBackPath', 'panFrontPath', 'panBackPath',
    'additionalDocumentPath',
  ],
  other: ['contractPath', 'otherDocumentPath'],
} as const satisfies Record<string, readonly string[]>;

export type FormSection = keyof typeof SECTION_FIELDS;
export const FORM_SECTIONS = Object.keys(SECTION_FIELDS) as FormSection[];

/** forms_layout.name for one section, e.g. "intern_onboard_personal". */
export const layoutName = (type: FormLayoutType, section: FormSection) =>
  `${type}_onboard_${section}`;

const LAYOUT_NAME_RE = new RegExp(
  `^(${FORM_LAYOUT_TYPES.join('|')})_onboard_(${FORM_SECTIONS.join('|')})$`,
);

const typeSchema = z.enum(FORM_LAYOUT_TYPES);

const fieldConfigSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  required: z.boolean({ error: 'required must be a boolean' }),
});

const sectionSchema = z.array(fieldConfigSchema, { error: 'must be an array of fields' });

export interface FormLayoutRowInput {
  name: string;
  data: FormFieldConfig[];
}

export interface FormLayoutSaveInput {
  type: FormLayoutType;
  rows: FormLayoutRowInput[];
}

export interface ContractTemplateInfo {
  filename: string;
  originalName: string;
}

export function toLayoutType(raw: unknown): FormLayoutType {
  return bindAndValidate(
    typeSchema,
    raw,
    `type must be one of: ${FORM_LAYOUT_TYPES.join(', ')}`,
  );
}

/**
 * Validates the POST /form-layout body:
 *   { "intern_onboard_personal": [{ name, required }], ... }
 * One key per section (a subset is fine — only the sections sent are saved),
 * all for the same layout type. Each becomes one forms_layout row.
 */
export function toSaveInput(body: unknown): FormLayoutSaveInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be an object keyed by section name.', 400);
  }
  const entries = Object.entries(body as Record<string, unknown>);
  if (!entries.length) {
    throw new AppError('At least one form layout section is required.', 400);
  }

  let type: FormLayoutType | null = null;
  const rows: FormLayoutRowInput[] = entries.map(([key, value]) => {
    const match = LAYOUT_NAME_RE.exec(key);
    if (!match) {
      throw new AppError(`Unknown form layout section "${key}".`, 400);
    }
    const keyType = match[1] as FormLayoutType;
    const section = match[2] as FormSection;
    if (type && type !== keyType) {
      throw new AppError('All sections must belong to the same layout type.', 400);
    }
    type = keyType;

    const parsed = sectionSchema.safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const where = [key, ...issue.path].join('.');
      throw new AppError(`${where}: ${issue.message}`, 400);
    }

    const allowed: readonly string[] = SECTION_FIELDS[section];
    const seen = new Set<string>();
    parsed.data.forEach(({ name }) => {
      if (!allowed.includes(name)) {
        throw new AppError(`${key}: unknown field "${name}".`, 400);
      }
      if (seen.has(name)) {
        throw new AppError(`${key}: duplicate field "${name}".`, 400);
      }
      seen.add(name);
    });

    return { name: key, data: parsed.data };
  });

  return { type: type!, rows };
}

/**
 * GET /form-layout response. Sections are keyed by forms_layout.name; only
 * configured sections are present. contractTemplate is returned both at the
 * top level (onboard-form-layout page) and inside `data` (OnboardForm).
 */
export function toLayoutResponse(
  sections: Record<string, FormFieldConfig[]>,
  contractTemplate: ContractTemplateInfo | null,
) {
  return {
    data: { ...sections, contractTemplate },
    contractTemplate,
  };
}
