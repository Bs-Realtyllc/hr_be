import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate } from '../pkg/validation';

const saveBodySchema = z.object({
  smtp_host: z.string().trim().min(1),
  smtp_port: z.coerce.number().int().min(1).max(65535),
  smtp_user: z.string().trim().min(1),
  smtp_pass: z.string(),
  smtp_from: z.string(),
  default_to: z.string(),
  default_cc: z.string(),
  default_bcc: z.string(),
});

export interface EmailSettingsSaveInput {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  default_to: string;
  default_cc: string;
  default_bcc: string;
}

export function toSaveInput(body: unknown): EmailSettingsSaveInput {
  const b = body as Record<string, any>;
  if (!b?.smtp_host || !b?.smtp_user) {
    throw new AppError('smtp_host and smtp_user are required', 400);
  }
  return bindAndValidate(saveBodySchema, {
    smtp_host: b.smtp_host,
    smtp_port: b.smtp_port || 587,
    smtp_user: b.smtp_user,
    smtp_pass: b.smtp_pass || '',
    smtp_from: b.smtp_from || b.smtp_user,
    default_to: b.default_to || '',
    default_cc: b.default_cc || '',
    default_bcc: b.default_bcc || '',
  });
}

export interface EmailSettingsResponse {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from: string | null;
  default_to: string | null;
  default_cc: string | null;
  default_bcc: string | null;
}
