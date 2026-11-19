const NEPAL_OFFSET_MINUTES = 5 * 60 + 45; // Asia/Kathmandu is UTC+5:45 year-round, no DST

// The calendar date in Nepal time for a given instant. This is the
// authoritative "business day" for attendance — independent of the
// server's own timezone and never trusted from the client.
export function nepalDateString(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + NEPAL_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().split('T')[0];
}

// 23:59:59 Nepal time, expressed as seconds past midnight UTC on the SAME
// calendar date — i.e. (24:00 - 0:00:01) minus the 5:45 Nepal offset.
// A `DATE` column's midnight (always stored/read as 00:00 UTC) plus this
// many seconds lands exactly on end-of-day Nepal time, in one SQL step,
// with no per-row JS computation needed.
export const NEPAL_END_OF_DAY_UTC_OFFSET_SECONDS = 24 * 3600 - 1 - NEPAL_OFFSET_MINUTES * 60;

// A wall-clock time ("HH:MM" or "HH:MM:SS") on a given Nepal calendar date,
// as the UTC instant it actually represents. Used to turn a company's
// configured work-start time into something comparable against a clock-in
// timestamp, which is always stored in UTC.
export function nepalTimeToUtc(dateStr: string, hhmmss: string): Date {
  const naiveUtc = new Date(`${dateStr}T${hhmmss.length === 5 ? hhmmss + ':00' : hhmmss}.000Z`);
  return new Date(naiveUtc.getTime() - NEPAL_OFFSET_MINUTES * 60 * 1000);
}
