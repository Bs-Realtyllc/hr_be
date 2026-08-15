import { mysqlTable, int, year, mysqlEnum } from 'drizzle-orm/mysql-core';

// System-maintained running counter, not a user-created resource — no
// BaseModel/audit columns (see migrate_zz_add_audit_columns_leaves.sql).
export const leaveBalances = mysqlTable('leave_balances', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  leave_type: mysqlEnum('leave_type', ['sick', 'bereavement', 'maternity', 'paternity']).notNull(),
  total: int('total').default(0),
  taken: int('taken').default(0),
  year: year('year').notNull(),
});

export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type NewLeaveBalance = typeof leaveBalances.$inferInsert;
