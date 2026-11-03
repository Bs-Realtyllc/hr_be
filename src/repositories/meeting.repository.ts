import { eq, and, gte, sql, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { meetings, employees } from '../../drizzle/schema';

const meetingsColumns = {
  id: meetings.id,
  title: meetings.title,
  description: meetings.description,
  start_datetime: meetings.startDatetime,
  end_datetime: meetings.endDatetime,
  attendees: meetings.attendees,
  google_event_id: meetings.googleEventId,
  meet_link: meetings.meetLink,
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
    .where(and(eq(meetings.status, 'scheduled'), sql`${meetings.startDatetime} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`))
    .orderBy(asc(meetings.startDatetime));
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
    createdBy: data.created_by,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select(meetingsColumns).from(meetings).where(eq(meetings.id, Number(id))).limit(1);
  return rows[0] || null;
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
      },
    });
}
