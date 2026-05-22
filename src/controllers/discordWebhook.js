const crypto = require('crypto');
const db = require('../db');

// Ed25519 SubjectPublicKeyInfo DER prefix for wrapping raw 32-byte public keys
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

function verifyDiscordSignature(publicKeyHex, rawBody, signatureHex, timestamp) {
  try {
    const keyDer = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyHex, 'hex')]);
    const publicKey = crypto.createPublicKey({ key: keyDer, format: 'der', type: 'spki' });
    const message = Buffer.concat([
      Buffer.from(timestamp, 'utf8'),
      Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8'),
    ]);
    return crypto.verify(null, message, publicKey, Buffer.from(signatureHex, 'hex'));
  } catch {
    return false;
  }
}

async function findEmployeeByDiscordName(discordName) {
  if (!discordName) return null;
  const [rows] = await db.query(
    'SELECT id, name FROM employees WHERE LOWER(name) LIKE LOWER(?) LIMIT 1',
    [`%${discordName}%`]
  );
  return rows[0] || null;
}

async function saveStandup(employeeId, yesterday, today, blockers) {
  const date = new Date().toISOString().split('T')[0];
  await db.query(
    `INSERT INTO standups (employee_id, yesterday, today, blockers, standup_date)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       yesterday = VALUES(yesterday),
       today     = VALUES(today),
       blockers  = VALUES(blockers)`,
    [employeeId, yesterday, today, blockers || 'None', date]
  );
}

exports.handleStandupWebhook = async (req, res) => {
  const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
  if (!PUBLIC_KEY) {
    console.error('[discord] DISCORD_PUBLIC_KEY is not set in .env');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  // ── Log every incoming hit so you can confirm Discord is reaching the server
  console.log('[discord] ← Incoming request');
  console.log(`[discord]   headers: x-signature-ed25519=${req.headers['x-signature-ed25519']?.slice(0, 16)}...`);
  console.log(`[discord]   body:    ${JSON.stringify(req.body).slice(0, 200)}`);

  const signature = req.headers['x-signature-ed25519'];
  const timestamp  = req.headers['x-signature-timestamp'];

  if (!signature || !timestamp) {
    console.warn('[discord] Rejected: missing signature headers');
    return res.status(401).send('Missing signature headers');
  }

  if (!verifyDiscordSignature(PUBLIC_KEY, req.rawBody, signature, timestamp)) {
    console.warn('[discord] Rejected: invalid Ed25519 signature');
    return res.status(401).send('Invalid request signature');
  }

  console.log('[discord] Signature OK');

  const { type, data, member } = req.body;

  // ── Webhook Events PING (type 0) ─────────────────────────────────────────────
  // Discord fires this when you first save the URL in the Developer Portal → Webhooks
  if (type === 0) {
    console.log('[discord] PING from Webhook Events — responding 204');
    return res.status(204).send();
  }

  // ── Interactions PING (type 1) ────────────────────────────────────────────────
  // Discord fires this when you save the URL in Developer Portal → General → Interactions Endpoint URL
  if (type === 1 && !req.body.event) {
    console.log('[discord] PING from Interactions — responding {type:1}');
    return res.status(200).json({ type: 1 });
  }

  // ── /standup Slash Command (type 2) ──────────────────────────────────────────
  // Employee types: /standup yesterday:... today:... blockers:...
  if (type === 2 && data?.name === 'standup') {
    const opts = Object.fromEntries((data.options || []).map(o => [o.name, o.value]));
    const discordUser = member?.user || req.body.user || {};
    const discordName = discordUser.global_name || discordUser.username || '';

    console.log(`[discord] /standup from "${discordName}" — yesterday="${opts.yesterday}" today="${opts.today}" blockers="${opts.blockers}"`);

    try {
      const employee = await findEmployeeByDiscordName(discordName);
      if (!employee) {
        console.warn(`[discord] No employee matched for "${discordName}"`);
        return res.status(200).json({
          type: 4,
          data: { content: `Could not find an employee matching your Discord name **${discordName}**. Ask an admin to check your name in the HR system.`, flags: 64 },
        });
      }

      await saveStandup(employee.id, opts.yesterday, opts.today, opts.blockers);
      console.log(`[discord] Standup saved — ${employee.name} (id ${employee.id})`);

      return res.status(200).json({
        type: 4,
        data: { content: `Standup saved for **${employee.name}**!\n> **Yesterday:** ${opts.yesterday}\n> **Today:** ${opts.today}\n> **Blockers:** ${opts.blockers || 'None'}`, flags: 64 },
      });
    } catch (err) {
      console.error('[discord] DB error saving standup:', err.message);
      return res.status(200).json({
        type: 4,
        data: { content: 'Something went wrong saving your standup. Please try again.', flags: 64 },
      });
    }
  }

  // ── Webhook Events (type 1 with event object) ─────────────────────────────────
  // None of the currently available events are relevant to standups, so just acknowledge.
  if (type === 1 && req.body.event) {
    console.log(`[discord] Webhook event received: ${req.body.event?.type} — no action needed`);
    return res.status(204).send();
  }

  console.log(`[discord] Unhandled type=${type}, ignoring`);
  return res.status(204).send();
};

// Called internally by the discord.js bot after a standup is confirmed.
// Protected by a shared secret — no Discord signature required.
exports.handleInternalStandup = async (req, res) => {
  const INTERNAL_TOKEN = process.env.DISCORD_INTERNAL_TOKEN;
  if (!INTERNAL_TOKEN || req.headers['x-internal-token'] !== INTERNAL_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { discordName, yesterday, today, blockers } = req.body;
  if (!discordName || !yesterday || !today) {
    return res.status(400).json({ error: 'Missing required fields: discordName, yesterday, today' });
  }

  try {
    const employee = await findEmployeeByDiscordName(discordName);
    if (!employee) {
      console.warn(`[discord-internal] No employee matched for "${discordName}"`);
      return res.status(404).json({ error: `No employee found matching "${discordName}"` });
    }

    await saveStandup(employee.id, yesterday, today, blockers);
    console.log(`[discord-internal] Standup saved — ${employee.name} (id ${employee.id})`);
    return res.json({ success: true, employee: employee.name });
  } catch (err) {
    console.error('[discord-internal] DB error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }
};
