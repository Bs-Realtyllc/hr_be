import { toDbUtc, zonedMidnight } from '../pkg/instant';

// Meetings store exact instants in UTC ("YYYY-MM-DD HH:mm:ss"), like every
// calendar time. Google sends timed events with an offset; all-day events
// only have a date, so they start at midnight in the event's zone (or
// APP_TIMEZONE when Google doesn't say).

/** An instant ("2026-11-28T04:15:00Z", "…T10:00:00+05:45") as the stored UTC string. */
export function toMySQLDatetime(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return isNaN(date.getTime()) ? null : toDbUtc(date);
}

/** Google's start/end: a timed event has dateTime; an all-day one only a date. */
function googleTimeToDatetime(
  time?: { dateTime?: string | null; date?: string | null; timeZone?: string | null } | null
): string | null {
  if (time?.dateTime) return toMySQLDatetime(time.dateTime);
  if (time?.date) return toDbUtc(zonedMidnight(time.date, time.timeZone || process.env.APP_TIMEZONE || 'UTC'));
  return null;
}

export function shapeGoogleEvent(event: any) {
  if (!event.start) return null;
  const startDt = googleTimeToDatetime(event.start);
  const endDt = googleTimeToDatetime(event.end);
  const meetLink = event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri || null;
  const attendees = JSON.stringify((event.attendees || []).map((a: any) => a.email));

  return {
    title: event.summary || 'Untitled',
    description: event.description || null,
    start_datetime: startDt,
    end_datetime: endDt,
    attendees,
    google_event_id: event.id,
    // The zone the event is shown in on Google, when it has one
    time_zone: event.start.timeZone || null,
    meet_link: meetLink,
  };
}
