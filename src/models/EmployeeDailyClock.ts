import {
  mysqlTable,
  int,
  timestamp,
  time,
  text,
  date,
  decimal,
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

    clockDate: date("clock_date", { mode: "string" }).default(sql`CURDATE()`),

     clockInLat: decimal("clock_in_lat", {
      precision: 9,
      scale: 6,
      mode: "number",
    }),

    clockInLng: decimal("clock_in_lng", {
      precision: 9,
      scale: 6,
      mode: "number",
    }),

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
