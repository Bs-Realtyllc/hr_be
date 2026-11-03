import { eq, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { holidays } from '../../drizzle/schema';

const holidaysColumns = {
  id: holidays.id,
  name: holidays.name,
  message: holidays.message,
  holiday_date: holidays.holidayDate,
  year: holidays.year,
  created_at: holidays.createdAt,
  updated_at: holidays.updatedAt,
  created_by: holidays.createdBy,
  updated_by: holidays.updatedBy,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findAll() {
  return db.select(holidaysColumns).from(holidays).orderBy(asc(holidays.holidayDate));
}

export async function findByYear(year: number | string) {
  return db.select(holidaysColumns).from(holidays).where(eq(holidays.year, Number(year))).orderBy(asc(holidays.holidayDate));
}

export async function create(
  { name, holiday_date, year, message }: any,
  actorId: number | null = null
) {
  const result = await db.insert(holidays).values({
    name,
    holidayDate: holiday_date,
    year,
    message: message || null,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function remove(id: number | string) {
  await db.delete(holidays).where(eq(holidays.id, Number(id)));
}
