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

// Parses standup fields from a Discord message.
// Expected format (flexible, case-insensitive, optional bold markers):
//   Yesterday: <text>
//   Today: <text>
//   Blockers: <text>
function parseStandup(content) {
  const extract = (pattern) => {
    const match = new RegExp(`\\*{0,2}${pattern}\\*{0,2}[:\\s]+([^\\n]+)`, 'i').exec(content);
    return match ? match[1].trim() : null;
  };
  return {
    yesterday: extract('yesterday') || extract('done') || extract('completed'),
    today:     extract('today')     || extract('doing') || extract('wip'),
    blockers:  extract('blockers?') || extract('blocker') || extract('impediments?') || 'None',
  };
}

async function findEmployeeByDiscordName(discordName) {
  if (!discordName) return null;
  const [rows] = await db.query(
    'SELECT id, name FROM employees WHERE LOWER(name) LIKE LOWER(?) LIMIT 1',
    [`%${discordName}%`]
  );
  return rows[0] || null;
}

exports.handleStandupWebhook = async (req, res) => {
  const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
  if (!PUBLIC_KEY) {
    console.error('[discord] DISCORD_PUBLIC_KEY is not set in .env');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const signature = req.headers['x-signature-ed25519'];
  const timestamp  = req.headers['x-signature-timestamp'];

  if (!signature || !timestamp) {
    return res.status(401).send('Missing signature headers');
  }

  if (!verifyDiscordSignature(PUBLIC_KEY, req.rawBody, signature, timestamp)) {
    return res.status(401).send('Invalid request signature');
  }

  const { type, event } = req.body;

  // Discord's initial PING — must respond 204 for the URL to be accepted
  if (type === 0) {
    return res.status(204).send();
  }

  // Webhook event payload
  if (type === 1 && event?.type === 'MESSAGE_CREATE') {
    const { content = '', author = {} } = event.data || {};
    const discordName = author.global_name || author.username || '';

    const parsed = parseStandup(content);

    if (!parsed.yesterday && !parsed.today) {
      // Not a standup message — ignore silently
      return res.status(204).send();
    }

    try {
      const employee = await findEmployeeByDiscordName(discordName);
      if (!employee) {
        console.warn(`[discord] No employee matched for Discord name "${discordName}"`);
        return res.status(204).send();
      }

      const today = new Date().toISOString().split('T')[0];
      await db.query(
        `INSERT INTO standups (employee_id, yesterday, today, blockers, standup_date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           yesterday = VALUES(yesterday),
           today     = VALUES(today),
           blockers  = VALUES(blockers)`,
        [employee.id, parsed.yesterday, parsed.today, parsed.blockers, today]
      );

      console.log(`[discord] Standup saved — employee: ${employee.name} (id: ${employee.id})`);
    } catch (err) {
      // Log but still return 204 so Discord doesn't retry unnecessarily
      console.error('[discord] Failed to save standup:', err.message);
    }
  }

  return res.status(204).send();
};
