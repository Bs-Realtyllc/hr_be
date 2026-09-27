import { mysqlTable, int, timestamp, text } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { employeeDailyClock } from "./EmployeeDailyClock";

export const employeeClockPauses = mysqlTable("employee_clock_pauses", {
  id: int("id").autoincrement().primaryKey(),

  clockId: int("clock_id")
    .notNull()
    .references(() => employeeDailyClock.id, { onDelete: "cascade" }),

  pause: timestamp("pause").default(sql`CURRENT_TIMESTAMP`),
  reason: text('reason').notNull(),
  resume: timestamp("resume").default(sql`NULL`),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});