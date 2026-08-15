import { z } from 'zod';
import { bindAndValidate } from '../pkg/validation';

const saveBodySchema = z.object({
  service_name: z.string().trim().min(1, 'service_name is required'),
  username: z.string().optional(),
  password: z.string().optional(),
  notes: z.string().optional(),
});

export interface ServiceCredentialSaveInput {
  service_name: string;
  username: string;
  password: string;
  notes: string;
}

export function toSaveInput(body: unknown): ServiceCredentialSaveInput {
  const parsed = bindAndValidate(saveBodySchema, body);
  return {
    service_name: parsed.service_name,
    username: parsed.username || '',
    password: parsed.password || '',
    notes: parsed.notes || '',
  };
}

export interface ServiceCredentialResponse {
  service_name: string;
  username: string | null;
  notes: string | null;
  updated_at: Date;
}
