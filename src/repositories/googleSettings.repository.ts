import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { googleSettings } from '../models';

// Same exported function names/signatures as the old src/models/GoogleSettings.js,
// plus a few extras (findFull/updateTokensAfterRefresh/updateChannelInfo/
// clearChannelInfo/findChannelExpiry) that replace the raw `db.query()` calls
// googleCalendar.js made directly against this table — see instruction.md's
// note on this domain. Singleton table (exactly one row expected), so several
// of these intentionally have no WHERE clause, matching the original SQL.

// Matches the original handleCallback query: only needs the row's id to decide insert vs update.
export async function findSingleton() {
  const rows = await db.select({ id: googleSettings.id }).from(googleSettings).limit(1);
  return rows[0] || null;
}

// Matches the original getStatus query.
export async function findConnectionStatus() {
  const rows = await db
    .select({ refresh_token: googleSettings.refresh_token, channel_expiry: googleSettings.channel_expiry })
    .from(googleSettings)
    .limit(1);
  return rows[0] || null;
}

export async function upsertTokens(
  { refresh_token, access_token, token_expiry }: { refresh_token?: string | null; access_token?: string | null; token_expiry?: Date | null },
  existingId?: number | null
) {
  if (existingId) {
    await db
      .update(googleSettings)
      .set({ refresh_token, access_token, token_expiry })
      .where(eq(googleSettings.id, existingId));
  } else {
    await db.insert(googleSettings).values({ refresh_token, access_token, token_expiry } as any);
  }
}

export async function clearTokens() {
  await db.update(googleSettings).set({ refresh_token: null, access_token: null, token_expiry: null });
}

// Full row — used by googleCalendar.js to build the authenticated OAuth client.
export async function findFull() {
  const rows = await db.select().from(googleSettings).limit(1);
  return rows[0] || null;
}

// Persists a refreshed access token (and, if Google rotated it, a new refresh token).
export async function updateTokensAfterRefresh(
  id: number,
  { access_token, token_expiry, refresh_token }: { access_token: string; token_expiry: Date; refresh_token?: string }
) {
  const setValues: Record<string, any> = { access_token, token_expiry };
  if (refresh_token) setValues.refresh_token = refresh_token;
  await db.update(googleSettings).set(setValues).where(eq(googleSettings.id, id));
}

export async function updateChannelInfo(channelId: string, resourceId: string, channelExpiry: Date) {
  await db.update(googleSettings).set({ channel_id: channelId, resource_id: resourceId, channel_expiry: channelExpiry });
}

export async function clearChannelInfo() {
  await db.update(googleSettings).set({ channel_id: null, resource_id: null, channel_expiry: null });
}

export async function findChannelExpiry() {
  const rows = await db.select({ channel_expiry: googleSettings.channel_expiry }).from(googleSettings).limit(1);
  return rows[0] || null;
}
