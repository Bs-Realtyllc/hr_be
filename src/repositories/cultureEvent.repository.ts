import { eq, and, asc, desc, sql, getTableColumns } from 'drizzle-orm';
import { db } from '../config/database';
import { cultureEvents, employeesFlat } from '../models';

// Same exported function names/signatures as the old src/models/CultureEvent.js.

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findUpcoming() {
  return db
    .select({
      ...getTableColumns(cultureEvents),
      employee_name: employeesFlat.name,
      profile_picture: employeesFlat.profile_picture,
    })
    .from(cultureEvents)
    .leftJoin(employeesFlat, eq(cultureEvents.employee_id, employeesFlat.id))
    .where(sql`${cultureEvents.event_date} BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`)
    .orderBy(asc(cultureEvents.event_date));
}

export async function findRecent() {
  return db
    .select({
      ...getTableColumns(cultureEvents),
      employee_name: employeesFlat.name,
    })
    .from(cultureEvents)
    .leftJoin(employeesFlat, eq(cultureEvents.employee_id, employeesFlat.id))
    .orderBy(desc(cultureEvents.event_date))
    .limit(50);
}

export async function create(
  { title, event_type, employee_id, event_date, description }: any,
  actorId: number | null = null
) {
  const result = await db.insert(cultureEvents).values({
    title,
    event_type,
    employee_id: employee_id || null,
    event_date,
    description,
    created_by: actorId,
    updated_by: actorId,
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function findBirthdayByEmployeeId(employeeId: number | string) {
  const rows = await db
    .select({ id: cultureEvents.id })
    .from(cultureEvents)
    .where(and(eq(cultureEvents.employee_id, Number(employeeId)), eq(cultureEvents.event_type, 'birthday')))
    .limit(1);
  return rows[0] || null;
}

export async function updateDateAndTitle(id: number | string, date: string, title: string) {
  await db.update(cultureEvents).set({ event_date: date, title }).where(eq(cultureEvents.id, Number(id)));
}

export async function createBirthday(employeeId: number | string, date: string, title: string, description: string) {
  await db.insert(cultureEvents).values({
    title,
    event_type: 'birthday',
    employee_id: Number(employeeId),
    event_date: date,
    description,
    created_at: new Date(),
  } as any);
}
