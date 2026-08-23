import { mysqlTable, int, varchar, decimal, tinyint, smallint } from 'drizzle-orm/mysql-core';

export const employeeTaxProfiles = mysqlTable('employee_tax_profiles', {
  id: int('id').autoincrement().primaryKey(),
  panNo: varchar('panNo', { length: 50 }).notNull(),
  month: tinyint('month').notNull(),
  year: smallint('year').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  tax_amount: decimal('tax_amount', { precision: 10, scale: 2 }),
  tax_perc: decimal('tax_perc', { precision: 5, scale: 2 }),
});

export type EmployeeTaxProfile = typeof employeeTaxProfiles.$inferSelect;
export type NewEmployeeTaxProfile = typeof employeeTaxProfiles.$inferInsert;
