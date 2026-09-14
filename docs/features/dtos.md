```markdown
---
import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const EMPLOYEE_STATUS = ['active', 'inactive'] as const;

const saveBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, 'name is required'),
  phone_number: z.string().optional(),
  email: z.string().optional(),
  status: optionalNullable(z.enum(EMPLOYEE_STATUS)),
  manager_id: optionalNullable(z.coerce.number().int().positive()),
});

export interface EmployeeSaveInput {
  employee_id: number;
  name: string;
  phone_number: string | null;
  email: string | null;
  status: (typeof EMPLOYEE_STATUS)[number];
  manager_id: number | null;
}

export function toSaveInput(body: unknown): EmployeeSaveInput {
  const b = body as Record<string, any>;
  const parsed = bindAndValidate(saveBodySchema, {
    employee_id: b.employee_id,
    name: b.name,
    phone_number: b.phone_number || null,
    email: b.email || null,
    status: b.status || 'active',
    manager_id: b.manager_id || null,
  });
  return { ...parsed, status: parsed.status as (typeof EMPLOYEE_STATUS)[number] };
}

export interface EmployeeResponse {
  employee_id: number;
  name: string;
  phone_number: string | null;
  email: string | null;
  status: (typeof EMPLOYEE_STATUS)[number];
  manager_id: number | null;
  created_at: Date;
  updated_at: Date;
}
```
