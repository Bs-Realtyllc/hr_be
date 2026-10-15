import { z } from 'zod';
import { bindAndValidate } from '../pkg/validation';

export interface UpdatePreferencesInput {
  preferences: { type: string; enabled: boolean }[];
}

const updatePreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        type: z.string().min(1),
        enabled: z.boolean(),
      }),
    )
    .min(1, 'At least one preference is required'),
});

export function toUpdatePreferencesInput(body: unknown): UpdatePreferencesInput {
  return bindAndValidate(updatePreferencesSchema, body, 'preferences array (type, enabled) is required');
}
