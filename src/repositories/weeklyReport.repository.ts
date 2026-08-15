import { eq, and, sql, desc, getTableColumns } from 'drizzle-orm';
import { db } from '../config/database';
import { weeklyReports, employeesFlat } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findWithEmployeeNames({
  employeeId,
  weekStartDate,
  year,
}: {
  employeeId?: number | string | null;
  weekStartDate?: string;
  year?: number | string;
}) {
  const conditions = [];
  if (employeeId) conditions.push(eq(weeklyReports.employee_id, Number(employeeId)));
  if (weekStartDate) conditions.push(eq(weeklyReports.week_start_date, weekStartDate));
  if (year) conditions.push(sql`YEAR(${weeklyReports.week_start_date}) = ${Number(year)}`);

  return db
    .select({
      ...getTableColumns(weeklyReports),
      employee_name: employeesFlat.name,
      designation: employeesFlat.designation,
      department: employeesFlat.department,
    })
    .from(weeklyReports)
    .innerJoin(employeesFlat, eq(weeklyReports.employee_id, employeesFlat.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(weeklyReports.week_start_date), desc(weeklyReports.submitted_at));
}

export async function create(data: any) {
  const result = await db.insert(weeklyReports).values({
    employee_id: data.employee_id,
    title: data.title,
    week_start_date: data.week_start_date,
    file_name: data.file_name,
    file_path: data.file_path,
    file_size: data.file_size,
    notes: data.notes ?? null,
    submitted_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select().from(weeklyReports).where(eq(weeklyReports.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function remove(id: number | string) {
  await db.delete(weeklyReports).where(eq(weeklyReports.id, Number(id)));
}
