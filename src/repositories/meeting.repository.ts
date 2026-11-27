import { eq, and, gt, lt, sql, asc, type SQL } from 'drizzle-orm';
import { db } from '../config/database';
import { meetings, employees } from '../../drizzle/schema';
import type { MeetingCreateInput, MeetingRange } from '../dtos/meeting.dto';

const meetingsColumns = {
  id: meetings.id,
  title: meetings.title,
  description: meetings.description,
  start_datetime: meetings.startDatetime,
  end_datetime: meetings.endDatetime,
  attendees: meetings.attendees,
  google_event_id: meetings.googleEventId,
  meet_link: meetings.meetLink,
  time_zone: meetings.timeZone,
  status: meetings.status,
  created_by: meetings.createdBy,
  updated_by: meetings.updatedBy,
  created_at: meetings.createdAt,
  updated_at: meetings.updatedAt,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findUpcomingScheduled() {
  return db
    .select({
      ...meetingsColumns,
      creator_name: employees.name,
    })
    .from(meetings)
    .leftJoin(employees, eq(meetings.createdBy, employees.id))
    .where(and(eq(meetings.status, 'scheduled'), sql`${meetings.startDatetime} >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)`))
    .orderBy(asc(meetings.startDatetime));
}

/**
 * Scheduled meetings that overlap [from, to), earliest first — the same rule
 * as calendar events. Either end may be left open.
 */
export async function findScheduledInRange({ from, to }: MeetingRange) {
  const conditions: SQL[] = [eq(meetings.status, 'scheduled')];
  if (from) conditions.push(gt(meetings.endDatetime, from));
  if (to) conditions.push(lt(meetings.startDatetime, to));

  return db
    .select({ ...meetingsColumns, creator_name: employees.name })
    .from(meetings)
    .leftJoin(employees, eq(meetings.createdBy, employees.id))
    .where(and(...conditions))
    .orderBy(asc(meetings.startDatetime), asc(meetings.id));
}

export async function create(data: any) {
  const result = await db.insert(meetings).values({
    title: data.title,
    description: data.description,
    startDatetime: data.start_datetime,
    endDatetime: data.end_datetime,
    attendees: data.attendees || [],
    googleEventId: data.google_event_id,
    meetLink: data.meet_link,
    timeZone: data.time_zone ?? null,
    createdBy: data.created_by,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db
    .select({ ...meetingsColumns, creator_name: employees.name })
    .from(meetings)
    .leftJoin(employees, eq(meetings.createdBy, employees.id))
    .where(eq(meetings.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

/** Replaces the editable fields. The Google event id and Meet link stay as they are. */
export async function update(id: number | string, data: MeetingCreateInput, actorId: number) {
  await db
    .update(meetings)
    .set({
      title: data.title,
      description: data.description,
      startDatetime: data.start_datetime,
      endDatetime: data.end_datetime,
      attendees: data.attendees,
      timeZone: data.time_zone,
      updatedBy: actorId,
    })
    .where(eq(meetings.id, Number(id)));
}

export async function cancel(id: number | string, actorId: number | null = null) {
  await db.update(meetings).set({ status: 'cancelled', updatedBy: actorId }).where(eq(meetings.id, Number(id)));
}

export async function upsertFromGoogleEvent({
  title,
  description,
  start_datetime,
  end_datetime,
  attendees,
  google_event_id,
  meet_link,
  time_zone,
}: any) {
  const attendeesArray = typeof attendees === 'string' ? JSON.parse(attendees) : attendees;
  await db
    .insert(meetings)
    .values({
      title,
      description,
      startDatetime: start_datetime,
      endDatetime: end_datetime,
      attendees: attendeesArray,
      googleEventId: google_event_id,
      meetLink: meet_link,
      timeZone: time_zone ?? null,
      createdAt: new Date(),
    } as any)
    .onDuplicateKeyUpdate({
      set: {
        title: sql`VALUES(title)`,
        description: sql`VALUES(description)`,
        startDatetime: sql`VALUES(start_datetime)`,
        endDatetime: sql`VALUES(end_datetime)`,
        attendees: sql`VALUES(attendees)`,
        meetLink: sql`VALUES(meet_link)`,
        // Keep the stored zone when Google doesn't send one
        timeZone: sql`COALESCE(VALUES(time_zone), ${meetings.timeZone})`,
      },
    });
}
