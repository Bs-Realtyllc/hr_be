import { z } from "zod";
import AppError from "../pkg/AppError";

const SELF_SERVICE_FIELDS = [
  "dob",
  "address",
  "name",
  "gender",
  "email",
  "secondary_email",
  "phone",
  "profile_picture",
  "designation",
  "department",
  "department_id",
  "manager_id",
  "start_date",
  "github_url",
  "discord_username",
  "tech_stack",
] as const;

const fieldSchemas = {
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be a date in YYYY-MM-DD format"),
  address: z.string().max(255),
  name: z.string().min(1).max(100),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  email: z.string().email(),
  secondary_email: z.string().email(),
  phone: z
    .string()
    .regex(
      /^\+?[0-9\s-]{7,15}$/,
      "phone must be 7-15 digits, optionally starting with +",
    ),
  profile_picture: z.string().url(),
  designation: z.string().max(100),
  department: z.string().max(100),
  department_id: z.int(),
  manager_id: z.int(),
  start_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "start_date must be a date in YYYY-MM-DD format",
    ),
  github_url: z.string().url(),
  discord_username: z
    .string()
    .regex(
      /^[a-z0-9_.]{2,32}$/,
      "discord_username must be 2-32 lowercase letters, numbers, _ or .",
    ),
  tech_stack: z.array(z.string().min(1).max(50)).max(30),
} as const;

export interface ProfileUpdateInput {
  dob?: string | null;
  address?: string | null;
}

export function toUpdateInput(body: unknown): ProfileUpdateInput {
  const b = body as Record<string, any>;
  const updates: ProfileUpdateInput = {};
  SELF_SERVICE_FIELDS.forEach((f) => {
    if (b[f] !== undefined) {
      const value = b[f] === "" ? null : b[f];
      if (value !== null) {
        // console.log(value, fieldSchemas[f])
        const result = fieldSchemas[f].safeParse(value);
        if (!result.success) {
          throw new AppError(`${f}: ${result.error.issues[0].message}`, 400);
        }
      }
      (updates as any)[f] = value;
    }
  });
  return updates;
}
