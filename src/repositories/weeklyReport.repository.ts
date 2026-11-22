import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { weeklyReports, employees, designations, departments } from '../../drizzle/schema';

const weeklyReportsColumns = {
  id: weeklyReports.id,
  employee_id: weeklyReports.employeeId,
  title: weeklyReports.title,
  week_start_date: weeklyReports.weekStartDate,
  file_name: weeklyReports.fileName,
  file_path: weeklyReports.filePath,
  file_size: weeklyReports.fileSize,
  notes: weeklyReports.notes,
  submitted_at: weeklyReports.submittedAt,
};

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
  if (employeeId) conditions.push(eq(weeklyReports.employeeId, Number(employeeId)));
  if (weekStartDate) conditions.push(eq(weeklyReports.weekStartDate, weekStartDate));
  if (year) conditions.push(sql`YEAR(${weeklyReports.weekStartDate}) = ${Number(year)}`);

  return db
    .select({
      ...weeklyReportsColumns,
      employee_name: employees.name,
      designation: designations.title,
      department: departments.name,
    })
    .from(weeklyReports)
    .innerJoin(employees, eq(weeklyReports.employeeId, employees.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(weeklyReports.weekStartDate), desc(weeklyReports.submittedAt));
}

export async function create(data: any) {
  const result = await db.insert(weeklyReports).values({
    employeeId: data.employee_id,
    title: data.title,
    weekStartDate: data.week_start_date,
    fileName: data.file_name,
    filePath: data.file_path,
    fileSize: data.file_size,
    notes: data.notes ?? null,
    submittedAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db.select(weeklyReportsColumns).from(weeklyReports).where(eq(weeklyReports.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function remove(id: number | string) {
  await db.delete(weeklyReports).where(eq(weeklyReports.id, Number(id)));
}
