import * as googleSettingsRepo from '../repositories/googleSettings.repository';
import * as meetingRepo from '../repositories/meeting.repository';
const gc = require('../services/googleCalendar');
const { shapeGoogleEvent } = require('../services/googleEventShaper');

export function getAuthUrl() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const err: any = new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured in .env');
    err.status = 500;
    throw err;
  }
  return gc.getAuthUrl();
}

export async function handleCallback(code: string) {
  const tokens = await gc.exchangeCodeForTokens(code);
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  const existing = await googleSettingsRepo.findSingleton();
  await googleSettingsRepo.upsertTokens(
    { refresh_token: tokens.refresh_token, access_token: tokens.access_token, token_expiry: expiry },
    existing?.id
  );

  if (process.env.GOOGLE_WEBHOOK_URL) {
    try {
      await gc.registerWebhookChannel(`${process.env.GOOGLE_WEBHOOK_URL}/api/google/webhook`);
    } catch (err: any) {
      console.warn('[google] Could not register webhook channel:', err.message);
    }
  }
}

export async function getStatus() {
  const row = await googleSettingsRepo.findConnectionStatus();
  return {
    connected: !!row?.refresh_token,
    webhookActive: !!(row?.channel_expiry && new Date(row.channel_expiry) > new Date()),
  };
}

export async function disconnect() {
  await gc.stopWebhookChannel();
  await googleSettingsRepo.clearTokens();
}

export async function sync() {
  const events = await gc.listUpcomingEvents();
  let upserted = 0;

  for (const event of events) {
    const shaped = shapeGoogleEvent(event);
    if (!shaped) continue;
    await meetingRepo.upsertFromGoogleEvent(shaped);
    upserted++;
  }

  return { synced: upserted };
}

export async function handleWebhook(resourceState: string | undefined) {
  if (resourceState === 'sync') return;

  try {
    const events = await gc.listUpcomingEvents(50);
    for (const event of events) {
      const shaped = shapeGoogleEvent(event);
      if (!shaped) continue;
      await meetingRepo.upsertFromGoogleEvent(shaped);
    }
  } catch (err: any) {
    console.error('[google] Webhook sync error:', err.message);
  }
}
