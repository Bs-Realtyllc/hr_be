import { int, timestamp } from 'drizzle-orm/mysql-core';

// Every table-backed model spreads one of these into its own column set —
// Drizzle schemas are plain objects, not classes, so "extends BaseModel"
// becomes "...baseColumns"/"...auditColumns" instead.
//
// created_at/updated_at are DB-defaulted (CURRENT_TIMESTAMP / ON UPDATE CURRENT_TIMESTAMP,
// see src/db/migrate_zz_add_audit_columns_pilot.sql) — Drizzle just reads them back,
// it never computes them itself.
//
// created_by/updated_by are NOT auto-populated by Drizzle (no request context available
// at the schema layer) — repositories set them explicitly from an `actorId` parameter
// threaded through from `req.user.id`, the same explicit style already used for
// `changed_by` on employee_job_history/employee_compensation_history.
//
// Append-only history tables (employee_job_history, employee_compensation_history) do NOT
// use this — they already have their own audit shape (changed_by + created_at, no
// updated_at, since a history row is never updated after insert) and forcing mutable-row
// audit columns onto them would fight that design.

// The created_at/updated_at/created_by/updated_by half of BaseModel, split out
// on its own for the handful of 1:1 tables (employee_auth, employee_profile)
// whose primary key IS the foreign key (employee_id) rather than a surrogate
// `id` — they get the audit columns but not the `id` column.
export const auditColumns = {
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date' }).onUpdateNow(),
  created_by: int('created_by'),
  updated_by: int('updated_by'),
};

export const baseColumns = {
  id: int('id').autoincrement().primaryKey(),
  ...auditColumns,
};
