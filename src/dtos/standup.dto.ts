import { z } from "zod";
import { bindAndValidate, optionalNullable } from "../pkg/validation";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a date in YYYY-MM-DD format");

const createBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  yesterday: z.string().trim().min(1, "yesterday is required"),
  today: z.string().trim().min(1, "today is required"),
  blockers: optionalNullable(z.string().trim()),
  standup_date: optionalNullable(dateString),
});

export interface StandupCreateInput {
  employee_id: number;
  yesterday: string;
  today: string;
  blockers?: string | null;
  standup_date?: string | null;
}

export interface StandupResponse {
  id: number;
  employee_id: number;
  employee_name: string;
  designation: string | null;
  profile_picture: string | null;
  workedOn: string | null;
  inProgress: string|null;
  completed: string|null;
  nextUp: string|null;
  links: string|null;
  blockers: string | null;
  standup_date: string;
  created_at: Date;
}

export function toCreateInput(body: unknown): StandupCreateInput {
  return bindAndValidate(createBodySchema, body);
}

export function toResponse(
  standup: Record<string, any> | null,
): StandupResponse | null {
  if (!standup) return null;
  return {
    id: standup.id,
    employee_id: standup.employee_id,
    employee_name: standup.employee_name,
    designation: standup.designation,
    profile_picture: standup.profile_picture,
    workedOn: standup.workedOn,
    completed: standup.completed,
    inProgress: standup.inProgress,
    nextUp: standup.nextUp,
    links: standup.links,
    blockers: standup.blockers,
    standup_date: standup.standup_date,
    created_at: standup.created_at,
  };
}

export function toResponseList(
  standups: Record<string, any>[],
): StandupResponse[] {
  return standups.map((s) => toResponse(s) as StandupResponse);
}
