import { z } from 'zod';
import { bindAndValidate } from '../pkg/validation';

const saveBodySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required'),
  email: z.string().trim().email('Invalid company email'),
  website: z.string().trim().min(1, 'Company website is required'),
});

export interface CompanySettingsSaveInput {
  name: string;
  email: string;
  website: string;
}

export function toSaveInput(body: unknown): CompanySettingsSaveInput {
  const b = body as Record<string, unknown>;
  return bindAndValidate(saveBodySchema, {
    name: b?.name,
    email: b?.email,
    website: b?.website,
  });
}
