import { eq, and, gt, gte, lte, or, sql, desc, getTableColumns } from 'drizzle-orm';
import { db } from '../config/database';
import { monthlyReports, employeesFlat } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findWithEmployeeNames({
  employeeId,
  month,
  year,
  fromYear,
  fromMonth,
  toYear,
  toMonth,
}: {
  employeeId?: number | string | null;
  month?: number | string;
  year?: number | string;
  fromYear?: number | string;
  fromMonth?: number | string;
  toYear?: number | string;
  toMonth?: number | string;
}) {
  const conditions = [];
  if (employeeId) conditions.push(eq(monthlyReports.employee_id, Number(employeeId)));
  if (month) conditions.push(eq(monthlyReports.month, Number(month)));
  if (year) conditions.push(eq(monthlyReports.year, Number(year)));
  if (fromYear && fromMonth) {
    conditions.push(
      sql`(${monthlyReports.year} > ${Number(fromYear)} OR (${monthlyReports.year} = ${Number(fromYear)} AND ${monthlyReports.month} >= ${Number(fromMonth)}))`
    );
  }
  if (toYear && toMonth) {
    conditions.push(
      sql`(${monthlyReports.year} < ${Number(toYear)} OR (${monthlyReports.year} = ${Number(toYear)} AND ${monthlyReports.month} <= ${Number(toMonth)}))`
    );
  }

  return db
    .select({
      ...getTableColumns(monthlyReports),
      employee_name: employeesFlat.name,
      designation: employeesFlat.designation,
      department: employeesFlat.department,
    })
    .from(monthlyReports)
    .innerJoin(employeesFlat, eq(monthlyReports.employee_id, employeesFlat.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(monthlyReports.year), desc(monthlyReports.month), desc(monthlyReports.submitted_at));
}

export async function create(data: any) {
  const result = await db.insert(monthlyReports).values({
    employee_id: data.employee_id,
    title: data.title,
    month: data.month,
    year: data.year,
    file_name: data.file_name,
    file_path: data.file_path,
    file_size: data.file_size,
    notes: data.notes ?? null,
    submitted_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select().from(monthlyReports).where(eq(monthlyReports.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function remove(id: number | string) {
  await db.delete(monthlyReports).where(eq(monthlyReports.id, Number(id)));
}
