import { eq, and, gte, sql, asc, getTableColumns } from 'drizzle-orm';
import { db } from '../config/database';
import { meetings, employees } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findUpcomingScheduled() {
  return db
    .select({
      ...getTableColumns(meetings),
      creator_name: employees.name,
    })
    .from(meetings)
    .leftJoin(employees, eq(meetings.created_by, employees.id))
    .where(and(eq(meetings.status, 'scheduled'), sql`${meetings.start_datetime} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`))
    .orderBy(asc(meetings.start_datetime));
}

export async function create(data: any) {
  const result = await db.insert(meetings).values({
    title: data.title,
    description: data.description,
    start_datetime: data.start_datetime,
    end_datetime: data.end_datetime,
    attendees: data.attendees || [],
    google_event_id: data.google_event_id,
    meet_link: data.meet_link,
    created_by: data.created_by,
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select().from(meetings).where(eq(meetings.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function cancel(id: number | string, actorId: number | null = null) {
  await db.update(meetings).set({ status: 'cancelled', updated_by: actorId }).where(eq(meetings.id, Number(id)));
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
      start_datetime,
      end_datetime,
      attendees: attendeesArray,
      google_event_id,
      meet_link,
      created_at: new Date(),
    } as any)
    .onDuplicateKeyUpdate({
      set: {
        title: sql`VALUES(title)`,
        description: sql`VALUES(description)`,
        start_datetime: sql`VALUES(start_datetime)`,
        end_datetime: sql`VALUES(end_datetime)`,
        attendees: sql`VALUES(attendees)`,
        meet_link: sql`VALUES(meet_link)`,
      },
    });
}
