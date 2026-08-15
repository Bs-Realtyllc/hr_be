import { mysqlTable, int, varchar, decimal, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { auditColumns } from './BaseModel';

export const employeeTaxProfiles = mysqlTable('employee_tax_profiles', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull().unique(),
  tax_id: varchar('tax_id', { length: 50 }),
  country: varchar('country', { length: 100 }).default('Bangladesh'),
  filing_status: mysqlEnum('filing_status', ['single', 'married', 'head_of_household']).default('single'),
  tax_regime: mysqlEnum('tax_regime', ['old', 'new']).default('new'),
  exemptions: decimal('exemptions', { precision: 12, scale: 2 }).default('0.00'),
  additional_withholding: decimal('additional_withholding', { precision: 12, scale: 2 }).default('0.00'),
  notes: text('notes'),
  ...auditColumns,
});

export type EmployeeTaxProfile = typeof employeeTaxProfiles.$inferSelect;
export type NewEmployeeTaxProfile = typeof employeeTaxProfiles.$inferInsert;
