import {
  mysqlTable,
  int,
  varchar,
  text,
  date,
  json,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const employeeOnboardingProfile = mysqlTable(
  "employee_onboarding_profile",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull(),
    gender: mysqlEnum("gender", [
      "male",
      "female",
      "other",
      "prefer_not_to_say",
    ]).notNull(),
    dob: date("dob", { mode: "string" }),
    email: varchar("email", { length: 150 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }),
    current_address: varchar("current_address", { length: 60 }),
    permanent_address: varchar("permanent_address", { length: 60 }),
    emergency_contact: varchar("emergency_contact", { length: 150 }),
    education_level: varchar("education_level", { length: 50 }),
    institution_name: varchar("institution_name", { length: 50 }),
    field_of_study: varchar("field_of_study", { length: 50 }),
    graduation_date: date("graduation_date", { mode: "string" }),
    previous_experience: text("previous_experience"),
    areas_of_interest: text("areas_of_interest"),
    linkedin_url: varchar("linkedin_url", { length: 255 }),
    github_url: varchar("github_url", { length: 255 }),
    portfolio_url: varchar("portfolio_url", { length: 255 }),
    role: mysqlEnum("role", ["intern", "employee"]).notNull(),
    additional_info: text("additional_info"),
    tech_stack: json("tech_stack"),
    nda_path: varchar("nda_path", { length: 255 }),
    citizenship_front_path: varchar("citizenship_front_path", { length: 255 }),
    citizenship_back_path: varchar("citizenship_back_path", { length: 255 }),
    pan_path: varchar("pan_path", { length: 255 }),
    photo_path: varchar("photo_path", { length: 255 }),
    passout_certificate_path: varchar("passout_certificate_path", { length: 255 }),
  },
);

export type EmployeeOnboardingProfile =
  typeof employeeOnboardingProfile.$inferSelect;
export type NewEmployeeOnboardingProfile =
  typeof employeeOnboardingProfile.$inferInsert;
