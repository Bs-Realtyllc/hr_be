import { eq, and, gt, gte, lte, or, sql, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { monthlyReports, employees, designations, departments } from '../../drizzle/schema';

const monthlyReportsColumns = {
  id: monthlyReports.id,
  employee_id: monthlyReports.employeeId,
  title: monthlyReports.title,
  month: monthlyReports.month,
  year: monthlyReports.year,
  file_name: monthlyReports.fileName,
  file_path: monthlyReports.filePath,
  file_size: monthlyReports.fileSize,
  notes: monthlyReports.notes,
  submitted_at: monthlyReports.submittedAt,
};

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
  if (employeeId) conditions.push(eq(monthlyReports.employeeId, Number(employeeId)));
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
      ...monthlyReportsColumns,
      employee_name: employees.name,
      designation: designations.title,
      department: departments.name,
    })
    .from(monthlyReports)
    .innerJoin(employees, eq(monthlyReports.employeeId, employees.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(monthlyReports.year), desc(monthlyReports.month), desc(monthlyReports.submittedAt));
}

export async function create(data: any) {
  const result = await db.insert(monthlyReports).values({
    employeeId: data.employee_id,
    title: data.title,
    month: data.month,
    year: data.year,
    fileName: data.file_name,
    filePath: data.file_path,
    fileSize: data.file_size,
    notes: data.notes ?? null,
    submittedAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select(monthlyReportsColumns).from(monthlyReports).where(eq(monthlyReports.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function remove(id: number | string) {
  await db.delete(monthlyReports).where(eq(monthlyReports.id, Number(id)));
}
