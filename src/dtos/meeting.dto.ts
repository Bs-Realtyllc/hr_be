import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

// Accepts any string JS's Date can parse (ISO 8601 datetime-local input, etc.) —
// the DB column is DATETIME, and meeting.repository.ts/googleCalendar.js
// already pass these straight through as date strings.
const datetimeString = z.string().refine((v) => !isNaN(Date.parse(v)), 'must be a valid date/time');

const createBodySchema = z
  .object({
    title: z.string().trim().min(1, 'title, start_datetime, and end_datetime are required'),
    description: optionalNullable(z.string()),
    start_datetime: datetimeString,
    end_datetime: datetimeString,
    attendees: z.array(z.unknown()),
  })
  .refine((data) => new Date(data.end_datetime) > new Date(data.start_datetime), {
    message: 'end_datetime must be after start_datetime',
    path: ['end_datetime'],
  });

export interface MeetingCreateInput {
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  attendees: string[];
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
  });
  return {
    title: parsed.title,
    description: parsed.description ?? null,
    start_datetime: parsed.start_datetime,
    end_datetime: parsed.end_datetime,
    attendees: parsed.attendees as string[],
  };
}

export interface MeetingResponse {
  id: number;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  attendees: string[] | null;
  google_event_id: string | null;
  meet_link: string | null;
  status: string;
  created_by: number | null;
  creator_name?: string | null;
}
