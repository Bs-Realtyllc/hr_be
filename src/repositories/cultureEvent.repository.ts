import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { cultureEvents, employees, employeeDocuments } from '../../drizzle/schema';

const cultureEventsColumns = {
  id: cultureEvents.id,
  title: cultureEvents.title,
  event_type: cultureEvents.eventType,
  employee_id: cultureEvents.employeeId,
  event_date: cultureEvents.eventDate,
  description: cultureEvents.description,
  slack_notified: cultureEvents.slackNotified,
  created_at: cultureEvents.createdAt,
  updated_at: cultureEvents.updatedAt,
  created_by: cultureEvents.createdBy,
  updated_by: cultureEvents.updatedBy,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findUpcoming() {
  return db
    .select({
      ...cultureEventsColumns,
      employee_name: employees.name,
      profile_picture: employeeDocuments.filename,
    })
    .from(cultureEvents)
    .leftJoin(employees, eq(cultureEvents.employeeId, employees.id))
    .leftJoin(employeeDocuments, and(eq(employeeDocuments.empId, employees.id), eq(employeeDocuments.name, 'profile_picture')))
    .where(sql`${cultureEvents.eventDate} BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`)
    .orderBy(asc(cultureEvents.eventDate));
}

export async function findRecent() {
  return db
    .select({
      ...cultureEventsColumns,
      employee_name: employees.name,
    })
    .from(cultureEvents)
    .leftJoin(employees, eq(cultureEvents.employeeId, employees.id))
    .orderBy(desc(cultureEvents.eventDate))
    .limit(50);
}

export async function create(
  { title, event_type, employee_id, event_date, description }: any,
  actorId: number | null = null
) {
  const result = await db.insert(cultureEvents).values({
    title,
    eventType: event_type,
    employeeId: employee_id || null,
    eventDate: event_date,
    description,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function findBirthdayByEmployeeId(employeeId: number | string) {
  const rows = await db
    .select({ id: cultureEvents.id })
    .from(cultureEvents)
    .where(and(eq(cultureEvents.employeeId, Number(employeeId)), eq(cultureEvents.eventType, 'birthday')))
    .limit(1);
  return rows[0] || null;
}

export async function updateDateAndTitle(id: number | string, date: string, title: string) {
  await db.update(cultureEvents).set({ eventDate: date, title }).where(eq(cultureEvents.id, Number(id)));
}

export async function createBirthday(employeeId: number | string, date: string, title: string, description: string) {
  await db.insert(cultureEvents).values({
    title,
    eventType: 'birthday',
    employeeId: Number(employeeId),
    eventDate: date,
    description,
    createdAt: new Date(),
  } as any);
}
