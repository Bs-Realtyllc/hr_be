import { eq, and, gt, lt, asc, type SQL } from 'drizzle-orm';
import { db } from '../config/database';
import { calendarEvents, employees } from '../../drizzle/schema';
import type { CalendarEventInput, CalendarEventRange } from '../dtos/calendarEvent.dto';

const calendarEventsColumns = {
  id: calendarEvents.id,
  title: calendarEvents.title,
  description: calendarEvents.description,
  start_datetime: calendarEvents.startDatetime,
  end_datetime: calendarEvents.endDatetime,
  event_type: calendarEvents.eventType,
  location: calendarEvents.location,
  meet_link: calendarEvents.meetLink,
  attendees: calendarEvents.attendees,
  time_zone: calendarEvents.timeZone,
  created_by: calendarEvents.createdBy,
  updated_by: calendarEvents.updatedBy,
  created_at: calendarEvents.createdAt,
  updated_at: calendarEvents.updatedAt,
  creator_name: employees.name,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

function selectWithCreator() {
  return db
    .select(calendarEventsColumns)
    .from(calendarEvents)
    .leftJoin(employees, eq(calendarEvents.createdBy, employees.id));
}

/**
 * Events that overlap [from, to), earliest first — so an event running past
 * the viewer's midnight shows on every day it touches. Both ends are UTC
 * "YYYY-MM-DD HH:mm:ss", like the columns.
 */
export async function findInRange({ from, to }: CalendarEventRange) {
  const conditions: SQL[] = [];
  if (from) conditions.push(gt(calendarEvents.endDatetime, from));
  if (to) conditions.push(lt(calendarEvents.startDatetime, to));

  return selectWithCreator()
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(calendarEvents.startDatetime), asc(calendarEvents.id));
}

export async function findById(id: number | string) {
  const rows = await selectWithCreator().where(eq(calendarEvents.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function create(data: CalendarEventInput, actorId: number) {
  const result = await db.insert(calendarEvents).values({
    title: data.title,
    description: data.description,
    startDatetime: data.start_datetime,
    endDatetime: data.end_datetime,
    eventType: data.event_type,
    location: data.location,
    meetLink: data.meet_link,
    attendees: data.attendees,
    timeZone: data.time_zone,
    createdBy: actorId,
    updatedBy: actorId,
  });
  return insertedId(result);
}

export async function update(id: number | string, data: CalendarEventInput, actorId: number) {
  await db
    .update(calendarEvents)
    .set({
      title: data.title,
      description: data.description,
      startDatetime: data.start_datetime,
      endDatetime: data.end_datetime,
      eventType: data.event_type,
      location: data.location,
      meetLink: data.meet_link,
      attendees: data.attendees,
      timeZone: data.time_zone,
      updatedBy: actorId,
    })
    .where(eq(calendarEvents.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(calendarEvents).where(eq(calendarEvents.id, Number(id)));
}
