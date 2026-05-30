const db = require('../db');
const gc = require('../services/googleCalendar');

// Convert any ISO-8601 string (with or without tz offset) to MySQL DATETIME format (UTC)
function toMySQLDatetime(iso) {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

exports.getAuthUrl = async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured in .env' });
  }
  res.json({ url: gc.getAuthUrl() });
};

exports.handleCallback = async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!code) return res.redirect(`${frontendUrl}/calendar?google_error=missing_code`);

  try {
    const tokens = await gc.exchangeCodeForTokens(code);
    const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Upsert into the single-row google_settings table
    const [[existing]] = await db.query('SELECT id FROM google_settings LIMIT 1');
    if (existing) {
      await db.query(
        `UPDATE google_settings SET refresh_token = ?, access_token = ?, token_expiry = ? WHERE id = ?`,
        [tokens.refresh_token || existing.refresh_token, tokens.access_token, expiry, existing.id]
      );
    } else {
      await db.query(
        `INSERT INTO google_settings (refresh_token, access_token, token_expiry) VALUES (?, ?, ?)`,
        [tokens.refresh_token, tokens.access_token, expiry]
      );
    }

    // Set up push notifications if a public webhook URL is configured
    if (process.env.GOOGLE_WEBHOOK_URL) {
      try {
        await gc.registerWebhookChannel(`${process.env.GOOGLE_WEBHOOK_URL}/api/google/webhook`);
      } catch (err) {
        console.warn('[google] Could not register webhook channel:', err.message);
      }
    }

    res.redirect(`${frontendUrl}/calendar?google_connected=true`);
  } catch (err) {
    console.error('[google] OAuth callback error:', err.message);
    res.redirect(`${frontendUrl}/calendar?google_error=true`);
  }
};

exports.getStatus = async (req, res) => {
  try {
    const [[row]] = await db.query('SELECT refresh_token, channel_expiry FROM google_settings LIMIT 1');
    res.json({
      connected: !!row?.refresh_token,
      webhookActive: !!(row?.channel_expiry && new Date(row.channel_expiry) > new Date()),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function handleGoogleError(err, res) {
  if (err.code === 'GOOGLE_NOT_CONNECTED') return res.status(503).json({ error: err.message, code: err.code });
  if (err.code === 'GOOGLE_TOKEN_REVOKED')  return res.status(401).json({ error: err.message, code: err.code });
  return res.status(500).json({ error: err.message });
}

exports.disconnect = async (req, res) => {
  try {
    await gc.stopWebhookChannel();
    await db.query(`UPDATE google_settings SET refresh_token = NULL, access_token = NULL, token_expiry = NULL`);
    res.json({ success: true });
  } catch (err) {
    handleGoogleError(err, res);
  }
};

exports.sync = async (req, res) => {
  try {
    const events = await gc.listUpcomingEvents();
    let upserted = 0;

    for (const event of events) {
      if (!event.start) continue;
      const startDt   = toMySQLDatetime(event.start.dateTime || `${event.start.date}T00:00:00`);
      const endDt     = toMySQLDatetime(event.end?.dateTime  || `${event.end?.date}T00:00:00`);
      const meetLink  = event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;
      const attendees = JSON.stringify((event.attendees || []).map(a => a.email));

      await db.query(
        `INSERT INTO meetings (title, description, start_datetime, end_datetime, attendees, google_event_id, meet_link)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title          = VALUES(title),
           description    = VALUES(description),
           start_datetime = VALUES(start_datetime),
           end_datetime   = VALUES(end_datetime),
           attendees      = VALUES(attendees),
           meet_link      = VALUES(meet_link)`,
        [event.summary || 'Untitled', event.description || null, startDt, endDt, attendees, event.id, meetLink]
      );
      upserted++;
    }

    res.json({ synced: upserted });
  } catch (err) {
    handleGoogleError(err, res);
  }
};

// Called by Google push notifications (no auth middleware)
exports.webhook = async (req, res) => {
  res.status(200).send('OK'); // Respond immediately

  const resourceState = req.headers['x-goog-resource-state'];
  if (resourceState === 'sync') return;

  try {
    const events = await gc.listUpcomingEvents(50);
    for (const event of events) {
      if (!event.start) continue;
      const startDt   = toMySQLDatetime(event.start.dateTime || `${event.start.date}T00:00:00`);
      const endDt     = toMySQLDatetime(event.end?.dateTime  || `${event.end?.date}T00:00:00`);
      const meetLink  = event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;
      const attendees = JSON.stringify((event.attendees || []).map(a => a.email));

      await db.query(
        `INSERT INTO meetings (title, description, start_datetime, end_datetime, attendees, google_event_id, meet_link)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title          = VALUES(title),
           start_datetime = VALUES(start_datetime),
           end_datetime   = VALUES(end_datetime),
           attendees      = VALUES(attendees),
           meet_link      = VALUES(meet_link)`,
        [event.summary || 'Untitled', event.description || null, startDt, endDt, attendees, event.id, meetLink]
      );
    }
  } catch (err) {
    console.error('[google] Webhook sync error:', err.message);
  }
};
