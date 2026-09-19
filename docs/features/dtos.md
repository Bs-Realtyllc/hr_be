---
title: TypeScript Interface and Object Creation for DTOs
author: Your Name
date: YYYY-MM-DD
template: default
---

## src/dtos/cultureEvent.dto.ts

```typescript
import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate } from '../pkg/validation';

const createBodySchema = z.object({
  event_id: z.coerce.number().int().positive(),
  event_type: z.enum(['event', 'holiday', 'meeting', 'overtime', 'performance', 'payroll', 'profile', 'serviceCredential', 'standup', 'weeklyReport', 'performanceReview']),
  title: z.string().trim().min(1),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().min(1, 'Description is required'),
  employee_id: z.coerce.number().int().positive(),
  employee_name: z.string().optional(),
  profile_picture: z.string().optional(),
  slack_notified: z.boolean().optional(),
  created_at: z.string().optional(),
});

export type CultureEventCreateInput = z.infer<typeof createBodySchema>;

export type CultureEventUpdateInput = z.infer<typeof createBodySchema>;

export type CultureEventCreateResponse = CultureEvent & { id: string };

export interface CultureEventResponse {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  description: string;
  employee_id: number;
  employee_name: string | null;
  profile_picture: string | null;
  slack_notified: boolean | null;
  created_at: string | null;
}

export function toResponse(event: CultureEvent): CultureEventResponse {
  return {
    id: event.id,
    title: event.title,
    event_type: event.event_type,
    employee_id: event.employee_id,
    ...(event.employee_name !== undefined && { employee_name: event.employee_name }),
    ...(event.profile_picture !== undefined && { profile_picture: event.profile_picture }),
    event_date: event.event_date,
    description: event.description,
    slack_notified: event.slack_notified,
    created_at: event.created_at,
  };
}

export function toResponseList(events: CultureEvent[]): CultureEventResponse[] {
  return events.map((e) => toResponse(e) as CultureEventResponse);
}
```
