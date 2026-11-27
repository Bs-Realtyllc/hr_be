import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';
import { fromDbUtc, instantField, toInstantRange, type InstantRange } from '../pkg/instant';

export const CALENDAR_EVENT_TYPES = ['in-person', 'online'] as const;
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

const bodySchema = z
  .object({
    title: z.string({ error: 'title is required' }).trim().min(1, 'title is required').max(255, 'title must be at most 255 characters'),
    description: optionalNullable(z.string()),
    start_datetime: instantField('start_datetime'),
    end_datetime: instantField('end_datetime'),
    event_type: z.enum(CALENDAR_EVENT_TYPES, { error: "event_type must be 'in-person' or 'online'" }),
    location: optionalNullable(z.string().trim().max(255, 'location must be at most 255 characters')),
    meet_link: optionalNullable(z.string().trim().max(500, 'meet_link must be at most 500 characters')),
    attendees: optionalNullable(z.array(z.string().trim().email('attendees must be email addresses'))),
  })
  .refine((d) => d.end_datetime > d.start_datetime, {
    message: 'end_datetime must be after start_datetime',
    path: ['end_datetime'],
  })
  .refine((d) => d.event_type !== 'in-person' || !!d.location, {
    message: 'location is required for an in-person event',
    path: ['location'],
  });

/** Body of POST /calendar-events and PUT /calendar-events/:id (the edit modal sends every field). */
export interface CalendarEventInput {
  title: string;
  description: string | null;
  /** UTC "YYYY-MM-DD HH:mm:ss", parsed from ISO 8601 with a zone */
  start_datetime: string;
  end_datetime: string;
  event_type: CalendarEventType;
  location: string | null;
  meet_link: string | null;
  attendees: string[];
}

export function toInput(body: unknown): CalendarEventInput {
  const parsed = bindAndValidate(bodySchema, body ?? {});
  const online = parsed.event_type === 'online';
  return {
    title: parsed.title,
    description: parsed.description?.trim() || null,
    start_datetime: parsed.start_datetime,
    end_datetime: parsed.end_datetime,
    event_type: parsed.event_type,
    // Only the field that matches the type is kept, so switching an event
    // from in-person to online (or back) clears the other one.
    location: online ? null : parsed.location || null,
    meet_link: online ? parsed.meet_link || null : null,
    // Unique, case-insensitive
    attendees: [...new Set((parsed.attendees ?? []).map((email) => email.toLowerCase()))],
  };
}

/** ?from=&to= on GET /calendar-events — ISO instants, either end open; items overlapping [from, to). */
export type CalendarEventRange = InstantRange;
export const toRange = toInstantRange;

export interface CalendarEventResponse {
  id: number;
  title: string;
  description: string | null;
  /** ISO 8601 in UTC ("…Z") */
  start_datetime: string;
  end_datetime: string;
  event_type: CalendarEventType;
  location: string | null;
  meet_link: string | null;
  attendees: string[];
  created_by: number | null;
  creator_name: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export function toResponse(row: Record<string, any> | null): CalendarEventResponse | null {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    start_datetime: fromDbUtc(row.start_datetime) as string,
    end_datetime: fromDbUtc(row.end_datetime) as string,
    event_type: row.event_type,
    location: row.location ?? null,
    meet_link: row.meet_link ?? null,
    attendees: Array.isArray(row.attendees) ? row.attendees : [],
    created_by: row.created_by ?? null,
    creator_name: row.creator_name ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

export function toResponseList(rows: Record<string, any>[]): CalendarEventResponse[] {
  return rows.map((r) => toResponse(r) as CalendarEventResponse);
}
