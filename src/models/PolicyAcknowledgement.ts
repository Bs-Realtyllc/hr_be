import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

// employee_id (submitter) + reviewed_by already identify the relevant
// actors — skips BaseModel's created_by/updated_by.
export const policyAcknowledgements = mysqlTable('policy_acknowledgements', {
  id: int('id').autoincrement().primaryKey(),
  policy_id: int('policy_id').notNull(),
  employee_id: int('employee_id').notNull(),
  signed_file_path: varchar('signed_file_path', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  rejection_reason: text('rejection_reason'),
  submitted_at: timestamp('submitted_at', { mode: 'date' }).notNull().defaultNow(),
  reviewed_by: int('reviewed_by'),
  reviewed_at: timestamp('reviewed_at', { mode: 'date' }),
});

export type PolicyAcknowledgement = typeof policyAcknowledgements.$inferSelect;
export type NewPolicyAcknowledgement = typeof policyAcknowledgements.$inferInsert;
