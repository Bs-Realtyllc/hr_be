import {
  mysqlTable,
  bigint,
  varchar,
  json,
  timestamp,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// Operation Log Table
export const operationLog = mysqlTable("operation_log", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  traceId: varchar("trace_id", { length: 36 }).notNull(),
  employeeId: bigint("employee_id", { mode: "number" }),
  operation: varchar("operation", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type OperationLog = typeof operationLog.$inferSelect;
export type NewOperationLog = typeof operationLog.$inferInsert;

