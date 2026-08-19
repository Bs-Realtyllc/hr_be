import { mysqlTable, int, varchar, text, date } from 'drizzle-orm/mysql-core';

export const employeeOnboardingProfile = mysqlTable('employee_onboarding_profile', {
  employee_id: int('employee_id').primaryKey(),
  education_level: varchar('education_level', { length: 100 }),
  institution_name: varchar('institution_name', { length: 150 }),
  field_of_study: varchar('field_of_study', { length: 150 }),
  graduation_date: date('graduation_date', { mode: 'string' }),
  previous_experience: text('previous_experience'),
  areas_of_interest: text('areas_of_interest'),
  linkedin_url: varchar('linkedin_url', { length: 255 }),
  portfolio_url: varchar('portfolio_url', { length: 255 }),
});

export type EmployeeOnboardingProfile = typeof employeeOnboardingProfile.$inferSelect;
export type NewEmployeeOnboardingProfile = typeof employeeOnboardingProfile.$inferInsert;
