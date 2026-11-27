import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate, optionalNullable } from '../pkg/validation';
import { fromDbUtc, instantField, isValidTimeZone } from '../pkg/instant';

// GET /google/meetings?from=&to= takes the same instant range as calendar events.
export { toRange, type CalendarEventRange as MeetingRange } from './calendarEvent.dto';

const createBodySchema = z
  .object({
    title: z.string().trim().min(1, 'title, start_datetime, and end_datetime are required'),
    description: optionalNullable(z.string()),
    start_datetime: instantField('start_datetime'),
    end_datetime: instantField('end_datetime'),
    attendees: z.array(z.string().trim().email('attendees must be email addresses')),
    time_zone: optionalNullable(z.string().refine(isValidTimeZone, 'time_zone must be an IANA timezone, like Asia/Kathmandu')),
  })
  .refine((data) => data.end_datetime > data.start_datetime, {
    message: 'end_datetime must be after start_datetime',
    path: ['end_datetime'],
  });

export interface MeetingCreateInput {
  title: string;
  description: string | null;
  /** UTC "YYYY-MM-DD HH:mm:ss", parsed from ISO 8601 with a zone */
  start_datetime: string;
  end_datetime: string;
  attendees: string[];
  /**
   * The scheduler's IANA zone. Only tells Google which zone to show the
   * event in (the times are exact either way); not stored. Null → APP_TIMEZONE.
   */
  time_zone: string | null;
}

export function toCreateInput(body: unknown): MeetingCreateInput {
  const b = body as Record<string, any>;
  if (!b?.title || !b?.start_datetime || !b?.end_datetime) {
    throw new AppError('title, start_datetime, and end_datetime are required', 400);
  }

  const parsed = bindAndValidate(createBodySchema, {
    title: b.title,
    description: b.description || null,
    start_datetime: b.start_datetime,
    end_datetime: b.end_datetime,
    attendees: b.attendees || [],
    time_zone: b.time_zone || null,
  });
  return {
    title: parsed.title,
    description: parsed.description ?? null,
    start_datetime: parsed.start_datetime,
    end_datetime: parsed.end_datetime,
    attendees: [...new Set(parsed.attendees.map((email) => email.toLowerCase()))],
    time_zone: parsed.time_zone ?? null,
  };
}

/** PUT /google/meetings/:id takes the same full body as create (the edit modal sends every field). */
export const toUpdateInput = toCreateInput;

export interface MeetingResponse {
  id: number;
  title: string;
  description: string | null;
  /** ISO 8601 in UTC ("…Z") */
  start_datetime: string;
  end_datetime: string;
  attendees: string[] | null;
  google_event_id: string | null;
  meet_link: string | null;
  status: string;
  created_by: number | null;
  creator_name?: string | null;
}

export function toResponse(row: Record<string, any> | null): MeetingResponse | null {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    start_datetime: fromDbUtc(row.start_datetime) as string,
    end_datetime: fromDbUtc(row.end_datetime) as string,
    attendees: Array.isArray(row.attendees) ? row.attendees : [],
    google_event_id: row.google_event_id ?? null,
    meet_link: row.meet_link ?? null,
    status: row.status,
    created_by: row.created_by ?? null,
    creator_name: row.creator_name ?? null,
  };
}

export function toResponseList(rows: Record<string, any>[]): MeetingResponse[] {
  return rows.map((r) => toResponse(r) as MeetingResponse);
}
