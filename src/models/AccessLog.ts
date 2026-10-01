import {
  mysqlTable,
  bigint,
  varchar,
  smallint,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// Access Log Table
export const accessLog = mysqlTable("access_log", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  traceId: varchar("trace_id", { length: 36 }).notNull(),
  employeeId: bigint("employee_id", { mode: "number" }),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  responseStatus: smallint("response_status").notNull(),
  responseDurationMs: int("response_duration_ms"),
  requestTimestamp: timestamp("request_timestamp"),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type AccessLog = typeof accessLog.$inferSelect;
export type NewAccessLog = typeof accessLog.$inferInsert;
