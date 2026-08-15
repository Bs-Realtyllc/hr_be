import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { employeeTaxProfiles, employeesFlat } from '../models';

export async function findAllWithProfile(id?: number | string | null) {
  return db
    .select({
      id: employeesFlat.id,
      name: employeesFlat.name,
      designation: employeesFlat.designation,
      department: employeesFlat.department,
      role: employeesFlat.role,
      salary: employeesFlat.salary,
      pay_frequency: employeesFlat.pay_frequency,
      tax_id: employeeTaxProfiles.tax_id,
      country: employeeTaxProfiles.country,
      filing_status: employeeTaxProfiles.filing_status,
      tax_regime: employeeTaxProfiles.tax_regime,
      exemptions: employeeTaxProfiles.exemptions,
      additional_withholding: employeeTaxProfiles.additional_withholding,
      notes: employeeTaxProfiles.notes,
      updated_at: employeeTaxProfiles.updated_at,
    })
    .from(employeesFlat)
    .leftJoin(employeeTaxProfiles, eq(employeeTaxProfiles.employee_id, employeesFlat.id))
    .where(id ? and(eq(employeesFlat.is_active, true), eq(employeesFlat.id, Number(id))) : eq(employeesFlat.is_active, true))
    .orderBy(employeesFlat.name);
}

export async function upsertProfile(employeeId: number | string, data: any, actorId: number | null = null) {
  await db.execute(sql`
    INSERT INTO employee_tax_profiles
      (employee_id, tax_id, country, filing_status, tax_regime, exemptions, additional_withholding, notes, created_by, updated_by)
    VALUES (${Number(employeeId)}, ${data.tax_id}, ${data.country}, ${data.filing_status}, ${data.tax_regime},
            ${data.exemptions}, ${data.additional_withholding}, ${data.notes}, ${actorId}, ${actorId})
    ON DUPLICATE KEY UPDATE
      tax_id = VALUES(tax_id), country = VALUES(country), filing_status = VALUES(filing_status),
      tax_regime = VALUES(tax_regime), exemptions = VALUES(exemptions),
      additional_withholding = VALUES(additional_withholding), notes = VALUES(notes),
      updated_by = ${actorId}
  `);
}
