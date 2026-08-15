import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const EVENT_TYPES = ['birthday', 'anniversary', 'team_event', 'milestone'] as const;

const createBodySchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  event_type: z.enum(EVENT_TYPES),
  employee_id: optionalNullable(z.coerce.number().int().positive()),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'event_date must be in YYYY-MM-DD format'),
  description: optionalNullable(z.string()),
});

export interface CultureEventCreateInput {
  title: string;
  event_type: (typeof EVENT_TYPES)[number];
  employee_id: number | null;
  event_date: string;
  description: string | null;
}

export interface CultureEventResponse {
  id: number;
  title: string;
  event_type: string;
  employee_id: number | null;
  employee_name?: string | null;
  profile_picture?: string | null;
  event_date: string;
  description: string | null;
  slack_notified: boolean | null;
  created_at: Date;
}

export function toCreateInput(body: unknown): CultureEventCreateInput {
  const parsed = bindAndValidate(createBodySchema, body);
  return {
    title: parsed.title,
    event_type: parsed.event_type,
    employee_id: parsed.employee_id || null,
    event_date: parsed.event_date,
    description: parsed.description || null,
  };
}

export function toResponse(event: Record<string, any> | null): CultureEventResponse | null {
  if (!event) return null;
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

export function toResponseList(events: Record<string, any>[]): CultureEventResponse[] {
  return events.map((e) => toResponse(e) as CultureEventResponse);
}
