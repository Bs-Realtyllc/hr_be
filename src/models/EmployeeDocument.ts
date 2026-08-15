import { mysqlTable, int, varchar, timestamp, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';

// Versioned file metadata (profile picture, citizenship docs). Superseded
// versions are kept with is_current=FALSE as free history — not on BaseModel,
// same append-only rationale as the history tables.
export const employeeDocuments = mysqlTable('employee_documents', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  doc_type: mysqlEnum('doc_type', ['profile_picture', 'citizenship_front', 'citizenship_back']).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  uploaded_by: int('uploaded_by'),
  uploaded_at: timestamp('uploaded_at', { mode: 'date' }).notNull().defaultNow(),
  is_current: boolean('is_current').notNull().default(true),
});

export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type NewEmployeeDocument = typeof employeeDocuments.$inferInsert;
