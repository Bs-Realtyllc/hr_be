import { eq, and, sql, desc, getTableColumns } from 'drizzle-orm';
import { db } from '../config/database';
import { payrollAdjustments, employeesFlat } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function create({
  employee_id,
  type,
  title,
  amount,
  year,
  month,
  reference_type,
  reference_id,
  notes,
}: any) {
  const result = await db.insert(payrollAdjustments).values({
    employee_id,
    type,
    title,
    amount: String(amount),
    year,
    month: month ?? null,
    reference_type: reference_type ?? null,
    reference_id: reference_id ?? null,
    notes: notes ?? null,
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function findForEmployeePeriod(employeeId: number | string, year: number, month: number) {
  return db
    .select()
    .from(payrollAdjustments)
    .where(
      and(
        eq(payrollAdjustments.employee_id, Number(employeeId)),
        eq(payrollAdjustments.year, year),
        sql`(${payrollAdjustments.month} = ${month} OR ${payrollAdjustments.month} IS NULL)`
      )
    )
    .orderBy(desc(payrollAdjustments.created_at));
}

export async function findAll({
  employeeId,
  year,
  month,
}: {
  employeeId?: number | string | null;
  year?: number | null;
  month?: number | null;
}) {
  const conditions = [];
  if (employeeId) conditions.push(eq(payrollAdjustments.employee_id, Number(employeeId)));
  if (year) conditions.push(eq(payrollAdjustments.year, year));
  if (month) conditions.push(eq(payrollAdjustments.month, month));

  return db
    .select({
      ...getTableColumns(payrollAdjustments),
      employee_name: employeesFlat.name,
      designation: employeesFlat.designation,
    })
    .from(payrollAdjustments)
    .innerJoin(employeesFlat, eq(payrollAdjustments.employee_id, employeesFlat.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(payrollAdjustments.created_at));
}

export async function summaryForPeriod(year: number, month: number) {
  const result: any = await db.execute(sql`
    SELECT employee_id,
           COALESCE(SUM(CASE WHEN type = 'overtime_pay'   AND month = ${month} THEN amount END), 0) AS overtime_pay,
           COALESCE(SUM(CASE WHEN type = 'leave_deduction' AND month = ${month} THEN amount END), 0) AS leave_deduction,
           COALESCE(SUM(CASE WHEN type = 'leave_bonus'     AND year = ${year}  THEN amount END), 0) AS leave_bonus
    FROM payroll_adjustments
    WHERE year = ${year}
    GROUP BY employee_id
  `);
  return result[0] as any[];
}

export async function existsBonusForYear(employeeId: number | string, year: number) {
  const rows = await db
    .select({ id: payrollAdjustments.id })
    .from(payrollAdjustments)
    .where(
      and(
        eq(payrollAdjustments.employee_id, Number(employeeId)),
        eq(payrollAdjustments.type, 'leave_bonus'),
        eq(payrollAdjustments.year, year)
      )
    )
    .limit(1);
  return !!rows[0];
}
