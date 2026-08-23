import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { employees, employeeCompensationHistory, employeeTaxProfiles, departments, designations } from '../models';

const ACTIVE_ROSTER = sql`${employees.status} NOT IN ('onboarding', 'terminated')`;

export async function findAllWithProfile(id: number | string | null | undefined, month: number, year: number) {
  return db
    .select({
      id: employees.id,
      name: employees.name,
      designation: designations.title,
      department: departments.name,
      role: employees.role,
      panNo: employees.panNo,
      salary: employeeCompensationHistory.salary,
      pay_frequency: employeeCompensationHistory.pay_frequency,
      amount: employeeTaxProfiles.amount,
      tax_amount: employeeTaxProfiles.tax_amount,
      tax_perc: employeeTaxProfiles.tax_perc,
    })
    .from(employees)
    .leftJoin(designations, eq(employees.designation_id, designations.id))
    .leftJoin(departments, eq(employees.department_id, departments.id))
    .leftJoin(
      employeeCompensationHistory,
      and(eq(employeeCompensationHistory.employee_id, employees.id), sql`${employeeCompensationHistory.effective_to} IS NULL`)
    )
    .leftJoin(
      employeeTaxProfiles,
      and(
        eq(employeeTaxProfiles.panNo, employees.panNo),
        eq(employeeTaxProfiles.month, month),
        eq(employeeTaxProfiles.year, year)
      )
    )
    .where(id ? and(ACTIVE_ROSTER, eq(employees.id, Number(id))) : ACTIVE_ROSTER)
    .orderBy(employees.name);
}

export async function findPanNoById(id: number | string) {
  const rows = await db.select({ panNo: employees.panNo }).from(employees).where(eq(employees.id, Number(id))).limit(1);
  return rows[0]?.panNo || null;
}

export async function upsertProfile(
  panNo: string,
  month: number,
  year: number,
  { amount, tax_amount, tax_perc }: { amount: number | null; tax_amount: number | null; tax_perc: number | null }
) {
  await db.execute(sql`
    INSERT INTO employee_tax_profiles (panNo, month, year, amount, tax_amount, tax_perc)
    VALUES (${panNo}, ${month}, ${year}, ${amount}, ${tax_amount}, ${tax_perc})
    ON DUPLICATE KEY UPDATE
      amount = VALUES(amount), tax_amount = VALUES(tax_amount), tax_perc = VALUES(tax_perc)
  `);
}
