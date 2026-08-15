import { google } from 'googleapis';
import * as googleSettingsRepo from '../repositories/googleSettings.repository';

// Single in-flight refresh promise — all concurrent callers await the same one
// instead of each racing to call refreshAccessToken() simultaneously.
let _refreshInFlight: Promise<void> | null = null;

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl() {
  const client = makeOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = makeOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

async function _doRefresh(client: any, row: any) {
  const { credentials } = await client.refreshAccessToken();

  // Google occasionally rotates the refresh token — persist it if returned.
  await googleSettingsRepo.updateTokensAfterRefresh(row.id, {
    access_token: credentials.access_token,
    token_expiry: new Date(credentials.expiry_date),
    refresh_token: credentials.refresh_token || undefined,
  });
  client.setCredentials(credentials);
}

// Returns an authenticated OAuth2 client, refreshing the access token if needed.
export async function getAuthenticatedClient() {
  const row: any = await googleSettingsRepo.findFull();

  if (!row?.refresh_token) {
    const err: any = new Error('Google Calendar not connected. Admin must connect first.');
    err.code = 'GOOGLE_NOT_CONNECTED';
    throw err;
  }

  const client = makeOAuth2Client();
  client.setCredentials({
    refresh_token: row.refresh_token,
    access_token: row.access_token,
    expiry_date: row.token_expiry ? new Date(row.token_expiry).getTime() : null,
  });

  const expiry = row.token_expiry ? new Date(row.token_expiry).getTime() : 0;
  const needsRefresh = !row.access_token || Date.now() > expiry - 5 * 60 * 1000;

  if (needsRefresh) {
    // Coalesce concurrent refresh attempts into one network call.
    if (!_refreshInFlight) {
      _refreshInFlight = _doRefresh(client, row).finally(() => {
        _refreshInFlight = null;
      });
    }
    try {
      await _refreshInFlight;
    } catch (err: any) {
      // HTTP 400/401 from Google means the refresh token was revoked;
      // the admin must go through the OAuth flow again.
      const status = err.response?.status;
      if (status === 400 || status === 401) {
        const revoked: any = new Error('Google Calendar token revoked. Admin must reconnect via /api/google/auth-url.');
        revoked.code = 'GOOGLE_TOKEN_REVOKED';
        throw revoked;
      }
      throw err;
    }
  }

  return client;
}

export async function createMeetingEvent({
  title,
  description,
  startDateTime,
  endDateTime,
  attendees,
}: {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
}) {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      description: description || '',
      start: { dateTime: startDateTime, timeZone: process.env.APP_TIMEZONE || 'UTC' },
      end: { dateTime: endDateTime, timeZone: process.env.APP_TIMEZONE || 'UTC' },
      attendees: (attendees || []).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const meetLink = data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri || null;
  return { googleEventId: data.id, meetLink };
}

export async function listUpcomingEvents(maxResults = 100) {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return data.items || [];
}

export async function registerWebhookChannel(webhookUrl: string) {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const channelId = `hr-cal-${Date.now()}`;
  const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

  const { data } = await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      expiration: expiration.toString(),
    },
  });

  await googleSettingsRepo.updateChannelInfo(data.id as string, data.resourceId as string, new Date(expiration));
}

export async function stopWebhookChannel() {
  const row: any = await googleSettingsRepo.findFull();
  if (!row?.channel_id || !row?.resource_id) return;

  try {
    const auth = await getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.channels.stop({
      requestBody: { id: row.channel_id, resourceId: row.resource_id },
    });
  } catch {
    // Best-effort; channel may already be expired
  }
  await googleSettingsRepo.clearChannelInfo();
}

// Call this on server startup (and periodically) to keep the push channel alive.
// Renews if the channel expires within 24 hours or is missing.
export async function renewWebhookChannelIfNeeded() {
  if (!process.env.GOOGLE_WEBHOOK_URL) return;

  const row: any = await googleSettingsRepo.findChannelExpiry();
  if (!row) return;

  const expiry = row.channel_expiry ? new Date(row.channel_expiry).getTime() : 0;
  const renewThreshold = Date.now() + 24 * 60 * 60 * 1000; // renew if < 24h left

  if (expiry < renewThreshold) {
    await stopWebhookChannel().catch(() => {});
    await registerWebhookChannel(`${process.env.GOOGLE_WEBHOOK_URL}/api/google/webhook`);
  }
}
