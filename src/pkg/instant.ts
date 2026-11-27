import { z } from 'zod';
import AppError from './AppError';

// Exact points in time for the calendar (meetings, calendar events).
//
// The API speaks ISO 8601 with a zone ("2026-11-28T10:00:00+05:45" or
// "…T04:15:00Z"); the DATETIME columns hold the same instant in UTC as
// "YYYY-MM-DD HH:mm:ss" (the pool runs with timezone '+00:00'). So every
// user can type and read times in their own timezone, and the stored value
// means the same moment for everyone.

// Date, time (seconds and fraction optional), then Z or ±HH:MM — a zone is required.
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

/** A Date as the UTC "YYYY-MM-DD HH:mm:ss" stored in DATETIME columns (milliseconds dropped). */
export function toDbUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/** A stored UTC "YYYY-MM-DD HH:mm:ss" as ISO "…Z" for the API; null stays null. */
export function fromDbUtc(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Zod field for an instant with an explicit zone; parses to the stored UTC
 * string. A time without a zone is refused — it would mean a different
 * moment depending on who sent it.
 */
export function instantField(field: string) {
  return z
    .string({ error: `${field} is required` })
    .trim()
    .refine(
      (v) => ISO_WITH_ZONE.test(v) && !isNaN(Date.parse(v)),
      `${field} must be an ISO 8601 date-time with a timezone, like 2026-11-28T10:00:00+05:45 or 2026-11-28T04:15:00Z`
    )
    .transform((v) => toDbUtc(new Date(v)));
}

/** ?from=&to= on the calendar lists: instants (UTC strings), either end open. */
export interface InstantRange {
  from: string | null;
  to: string | null;
}

/**
 * Reads ?from=&to= (ISO 8601 with a zone; the frontend sends the user's own
 * day or month boundaries, so "a day" is the viewer's day). Items overlapping
 * [from, to) are returned. A "+" offset that arrives unescaped in a query
 * string becomes a space, so that's put back first.
 */
export function toInstantRange(query: unknown): InstantRange {
  const q = (query ?? {}) as Record<string, unknown>;
  const read = (field: 'from' | 'to') => {
    const raw = q[field];
    if (raw === undefined || raw === null || raw === '') return null;
    const parsed = instantField(field).safeParse(typeof raw === 'string' ? raw.replace(' ', '+') : raw);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    return parsed.data;
  };
  const from = read('from');
  const to = read('to');
  if (from && to && from >= to) throw new AppError('from must be before to', 400);
  return { from, to };
}

/** True for an IANA zone this runtime knows ("Asia/Kathmandu", "America/New_York", "UTC"). */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Minutes `timeZone` is ahead of UTC at `date` (Kathmandu: +345; New York: -300 or -240). */
function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Midnight of "YYYY-MM-DD" in `timeZone`, as a Date (for all-day Google events, which have no time). */
export function zonedMidnight(dateStr: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  // Two passes settle the offset even when the zone changes it that day (DST)
  let result = guess - zoneOffsetMinutes(new Date(guess), timeZone) * 60000;
  result = guess - zoneOffsetMinutes(new Date(result), timeZone) * 60000;
  return new Date(result);
}
