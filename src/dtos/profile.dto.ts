import { z } from "zod";
import AppError from "../pkg/AppError";

const SELF_SERVICE_FIELDS = [
  "dob",
  "current_address",
  "permanent_address",
  "name",
  "gender",
  "email",
  "secondary_email",
  "phone",
  "profile_picture",
  "start_date",
  "work_hours",
  "github_url",
  "work_location",
  "discord_username",
  "nationality",
  "emergency_contact_name",
  "emergency_contact_relation",
  "emergency_contact_phone",
  "emergency_contact_address",
  "emergency_contact_email",
  "account_holder_name",
  "account_number",
  "account_type",
  "bank_name",
  "bank_branch_name"
] as const;

const fieldSchemas = {
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be a date in YYYY-MM-DD format"),
  current_address: z.string().max(255),
  permanent_address: z.string().max(255),
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
    emergency_contact_name: z.string(),
    emergency_contact_email: z.string().email(),
    emergency_contact_address: z.string(),
    emergency_contact_phone: z
    .string()
    .regex(
      /^\+?[0-9\s-]{7,15}$/,
      "phone must be 7-15 digits, optionally starting with +",
    ),
    emergency_contact_relation: z.string(),
    nationality: z.string(),
    work_hours: z.string(),
    work_location: z.enum(["onsite", "remote", "hybrid"]),
    account_holder_name : z.string(),
    account_number: z.string(),
    account_type: z.string(),
    bank_name: z.string(),
    bank_branch_name: z.string(),


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
