import {
  mysqlTable,
  int,
  timestamp,
  time,
  text,
  date,
  unique,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { employees } from "./Employee"; // adjust import path to your actual employees model

export const employeeDailyClock = mysqlTable(
  "employee_daily_clock",
  {
    id: int("id").autoincrement().primaryKey(),

    employeeId: int("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),

    clockIn: timestamp("clock_in").default(sql`CURRENT_TIMESTAMP`),

    clockOut: timestamp("clock_out").default(sql`NULL`),

    pause: timestamp("pause").default(sql`NULL`),

    resume: timestamp("resume").default(sql`NULL`),

    pause_reason: text("pause_reason"),

    duration: time("duration", { fsp: 0 }).generatedAlwaysAs(
      sql`SEC_TO_TIME(TIMESTAMPDIFF(SECOND, clock_in, clock_out) - COALESCE(TIMESTAMPDIFF(SECOND, pause, resume), 0))`,
      { mode: "stored" },
    ),

    clockDate: date("clock_date", { mode: "string" }).default(sql`CURDATE()`),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    uniqueEmployeeDay: unique("unique_employee_day").on(
      table.employeeId,
      table.clockDate,
    ),
  }),
);
