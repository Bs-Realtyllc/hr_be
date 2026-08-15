// Convert any ISO-8601 string (with or without tz offset) to MySQL DATETIME format (UTC)
function toMySQLDatetime(iso) {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}
exports.toMySQLDatetime = toMySQLDatetime;

// Shape a Google Calendar event object into a meetings row ready for Meeting.upsertFromGoogleEvent.
// Returns null for events without a start time (skipped, same as the original loops).
exports.shapeGoogleEvent = (event) => {
  if (!event.start) return null;
  const startDt   = toMySQLDatetime(event.start.dateTime || `${event.start.date}T00:00:00`);
  const endDt     = toMySQLDatetime(event.end?.dateTime  || `${event.end?.date}T00:00:00`);
  const meetLink  = event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;
  const attendees = JSON.stringify((event.attendees || []).map(a => a.email));

  return {
    title: event.summary || 'Untitled',
    description: event.description || null,
    start_datetime: startDt,
    end_datetime: endDt,
    attendees,
    google_event_id: event.id,
    meet_link: meetLink,
  };
};
