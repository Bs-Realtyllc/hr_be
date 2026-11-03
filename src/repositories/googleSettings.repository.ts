import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { googleSettings } from '../../drizzle/schema';

const googleSettingsColumns = {
  id: googleSettings.id,
  refresh_token: googleSettings.refreshToken,
  access_token: googleSettings.accessToken,
  token_expiry: googleSettings.tokenExpiry,
  channel_id: googleSettings.channelId,
  resource_id: googleSettings.resourceId,
  channel_expiry: googleSettings.channelExpiry,
  updated_at: googleSettings.updatedAt,
};

export async function findSingleton() {
  const rows = await db.select({ id: googleSettings.id }).from(googleSettings).limit(1);
  return rows[0] || null;
}

export async function findConnectionStatus() {
  const rows = await db
    .select({ refresh_token: googleSettings.refreshToken, channel_expiry: googleSettings.channelExpiry })
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
      .set({ refreshToken: refresh_token, accessToken: access_token, tokenExpiry: token_expiry })
      .where(eq(googleSettings.id, existingId));
  } else {
    await db.insert(googleSettings).values({ refreshToken: refresh_token, accessToken: access_token, tokenExpiry: token_expiry } as any);
  }
}

export async function clearTokens() {
  await db.update(googleSettings).set({ refreshToken: null, accessToken: null, tokenExpiry: null });
}

export async function findFull() {
  const rows = await db.select(googleSettingsColumns).from(googleSettings).limit(1);
  return rows[0] || null;
}

export async function updateTokensAfterRefresh(
  id: number,
  { access_token, token_expiry, refresh_token }: { access_token: string; token_expiry: Date; refresh_token?: string }
) {
  const setValues: Record<string, any> = { accessToken: access_token, tokenExpiry: token_expiry };
  if (refresh_token) setValues.refreshToken = refresh_token;
  await db.update(googleSettings).set(setValues).where(eq(googleSettings.id, id));
}

export async function updateChannelInfo(channelId: string, resourceId: string, channelExpiry: Date) {
  await db.update(googleSettings).set({ channelId, resourceId, channelExpiry });
}

export async function clearChannelInfo() {
  await db.update(googleSettings).set({ channelId: null, resourceId: null, channelExpiry: null });
}

export async function findChannelExpiry() {
  const rows = await db.select({ channel_expiry: googleSettings.channelExpiry }).from(googleSettings).limit(1);
  return rows[0] || null;
}
