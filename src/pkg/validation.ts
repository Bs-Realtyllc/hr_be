import { z, ZodTypeAny } from 'zod';
import AppError from './AppError';

// The one place every DTO binds+validates a request body against its Zod
// schema. Before this, employee.dto.ts hand-rolled a validateField loop and
// auth.dto.ts hand-rolled its own parseOrThrow — same job, two copies. Every
// DTO's toXInput function should now be: build a Zod schema, call this once.
//
// Throws AppError (status 400 by default) with either a caller-supplied
// message or Zod's own first-issue message — same shape the errorHandler
// middleware already expects (`err.status` + `err.message`).
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

// Wraps a field schema to also accept null (in addition to Zod's own
// `.optional()` for "field omitted entirely") — several endpoints in this
// API have always treated an explicit `null` the same as "not provided,
// use the default", so this keeps that behavior in one place instead of
// every DTO remembering to chain `.nullable().optional()` itself.
export function optionalNullable<T extends ZodTypeAny>(schema: T) {
  return schema.nullable().optional();
}
