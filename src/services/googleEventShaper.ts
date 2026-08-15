export function toMySQLDatetime(iso?: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

// Shape a Google Calendar event object into a meetings row ready for Meeting.upsertFromGoogleEvent.
// Returns null for events without a start time (skipped, same as the original loops).
export function shapeGoogleEvent(event: any) {
  if (!event.start) return null;
  const startDt = toMySQLDatetime(event.start.dateTime || `${event.start.date}T00:00:00`);
  const endDt = toMySQLDatetime(event.end?.dateTime || `${event.end?.date}T00:00:00`);
  const meetLink = event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri || null;
  const attendees = JSON.stringify((event.attendees || []).map((a: any) => a.email));

  return {
    title: event.summary || 'Untitled',
    description: event.description || null,
    start_datetime: startDt,
    end_datetime: endDt,
    attendees,
    google_event_id: event.id,
    meet_link: meetLink,
  };
}
