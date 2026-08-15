import { z, ZodTypeAny } from 'zod';
import AppError from './AppError';

export function bindAndValidate<T extends ZodTypeAny>(
  schema: T,
  data: unknown,
  message?: string,
  status = 400
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(message || result.error.issues[0].message, status);
  }
  return result.data;
}

export function optionalNullable<T extends ZodTypeAny>(schema: T) {
  return schema.nullable().optional();
}
