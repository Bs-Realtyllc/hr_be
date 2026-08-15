import { z } from 'zod';
import AppError from '../pkg/AppError';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

// Matches the `servers.environment` ENUM in schema.sql.
const ENVIRONMENTS = ['development', 'staging', 'production'] as const;

const serverFields = {
  name: z.string().trim().min(1, 'name is required'),
  environment: z.enum(ENVIRONMENTS),
  ip_address: z.string(),
  domain: z.string(),
  ssh_user: z.string(),
  notes: z.string(),
  is_sensitive: z.coerce.boolean(),
};

const createBodySchema = z.object({
  project_id: optionalNullable(z.coerce.number().int().positive()),
  name: serverFields.name,
  environment: serverFields.environment,
  ip_address: optionalNullable(serverFields.ip_address),
  domain: optionalNullable(serverFields.domain),
  ssh_user: optionalNullable(serverFields.ssh_user),
  notes: optionalNullable(serverFields.notes),
  is_sensitive: optionalNullable(serverFields.is_sensitive),
});

const UPDATE_FIELD_NAMES = ['name', 'environment', 'ip_address', 'domain', 'ssh_user', 'notes', 'is_sensitive'] as const;
const updateBodySchema = z.object({
  name: optionalNullable(serverFields.name),
  environment: optionalNullable(serverFields.environment),
  ip_address: optionalNullable(serverFields.ip_address),
  domain: optionalNullable(serverFields.domain),
  ssh_user: optionalNullable(serverFields.ssh_user),
  notes: optionalNullable(serverFields.notes),
  is_sensitive: optionalNullable(serverFields.is_sensitive),
});

export interface ServerCreateInput {
  project_id: number | null;
  name: string;
  environment: (typeof ENVIRONMENTS)[number];
  ip_address: string | null;
  domain: string | null;
  ssh_user: string | null;
  notes: string | null;
  is_sensitive: boolean;
}

export interface ServerUpdateInput {
  name?: string;
  environment?: (typeof ENVIRONMENTS)[number];
  ip_address?: string | null;
  domain?: string | null;
  ssh_user?: string | null;
  notes?: string | null;
  is_sensitive?: boolean;
}

export interface ServerResponse {
  id: number;
  project_id: number | null;
  project_name?: string | null;
  name: string;
  environment: string;
  ip_address: string | null;
  domain: string | null;
  ssh_user: string | null;
  notes: string | null;
  is_sensitive: boolean | null;
  created_at: Date;
}

export function toCreateInput(body: unknown): ServerCreateInput {
  const b = body as Record<string, any>;
  if (!b?.name || !b?.environment) {
    throw new AppError('name and environment are required', 400);
  }
  const parsed = bindAndValidate(createBodySchema, body);
  return {
    project_id: parsed.project_id || null,
    name: parsed.name,
    environment: parsed.environment,
    ip_address: parsed.ip_address ?? null,
    domain: parsed.domain ?? null,
    ssh_user: parsed.ssh_user ?? null,
    notes: parsed.notes ?? null,
    is_sensitive: parsed.is_sensitive || false,
  };
}

export function toUpdateInput(body: unknown): ServerUpdateInput {
  const parsed = bindAndValidate(updateBodySchema, body);
  const b = body as Record<string, any>;
  const updates: ServerUpdateInput = {};
  UPDATE_FIELD_NAMES.forEach((f) => {
    if (b[f] !== undefined) (updates as any)[f] = (parsed as any)[f];
  });
  return updates;
}

// Mask sensitive fields unless the caller explicitly asked to see them (role-based in real app).
export function toResponseList(rows: Record<string, any>[], showSensitive: boolean): ServerResponse[] {
  return rows.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    project_name: r.project_name,
    name: r.name,
    environment: r.environment,
    ip_address: showSensitive ? r.ip_address : r.is_sensitive ? '••••••••' : r.ip_address,
    domain: r.domain,
    ssh_user: showSensitive ? r.ssh_user : r.is_sensitive ? '••••••••' : r.ssh_user,
    notes: r.notes,
    is_sensitive: r.is_sensitive,
    created_at: r.created_at,
  }));
}
