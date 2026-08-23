import {
  mysqlTable,
  int,
  varchar,
  date,
  text,
  mysqlEnum,
  decimal,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/mysql-core";

export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  gender: mysqlEnum("gender", ["male", "female", "other", "prefer_not_to_say"]),
  email: varchar("email", { length: 150 }).notNull().unique(),
  secondary_email: varchar("secondary_email", { length: 150 }).unique(),
  phone: varchar("phone", { length: 20 }),
  emergency_contact: varchar("emergency_contact", { length: 150 }),
  profile_picture: varchar("profile_picture", { length: 255 }),
  designation: varchar("designation", { length: 100 }),
  designation_id: int("designation_id"),
  department: varchar("department", { length: 100 }),
  department_id: int("department_id"),
  manager_id: int("manager_id"),
  start_date: date("start_date", { mode: "string" }),
  dob: date("dob", { mode: "string" }),
  github_url: varchar("github_url", { length: 255 }),
  address: text("address"),
  discord_username: varchar("discord_username", { length: 100 }).unique(),
  panNo: varchar("panNo", { length: 50 }).unique(),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  work_hours: varchar("work_hours", { length: 50 }).default("9 AM - 5 PM"),
  tech_stack: json("tech_stack"),
  role: mysqlEnum("role", ["admin", "lead", "employee", "intern"])
    .notNull()
    .default("employee"),
  password_hash: varchar("password_hash", { length: 255 }),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  pay_frequency: mysqlEnum("pay_frequency", [
    "monthly",
    "biweekly",
    "weekly",
  ]).default("monthly"),
  is_active: boolean("is_active").default(true),
  status: mysqlEnum("status", [
    "onboarding",
    "active",
    "on_leave",
    "probation",
    "terminated",
  ])
    .notNull()
    .default("active"),
  termination_date: date("termination_date", { mode: "string" }),
  termination_reason: varchar("termination_reason", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
  created_by: int("created_by"),
  updated_by: int("updated_by"),
  leave_policy_accepted: boolean("leave_policy_accepted").default(false),
  leave_policy_accepted_at: timestamp("leave_policy_accepted_at"),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
