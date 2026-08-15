import { eq, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { holidays } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findAll() {
  return db.select().from(holidays).orderBy(asc(holidays.holiday_date));
}

export async function findByYear(year: number | string) {
  return db.select().from(holidays).where(eq(holidays.year, Number(year))).orderBy(asc(holidays.holiday_date));
}

export async function create(
  { name, holiday_date, year, message }: any,
  actorId: number | null = null
) {
  const result = await db.insert(holidays).values({
    name,
    holiday_date,
    year,
    message: message || null,
    created_by: actorId,
    updated_by: actorId,
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function remove(id: number | string) {
  await db.delete(holidays).where(eq(holidays.id, Number(id)));
}
