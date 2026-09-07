import { Request, Response } from 'express';
const { verifyDiscordSignature, findEmployeeByDiscordName, saveStandup } = require('../services/discordStandupService');

export const handleStandupWebhook = async (req: Request, res: Response) => {
  const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
  if (!PUBLIC_KEY) {
    console.error('[discord] DISCORD_PUBLIC_KEY is not set in .env');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  console.log('[discord] ← Incoming request');
  console.log(`[discord]   headers: x-signature-ed25519=${(req.headers['x-signature-ed25519'] as string)?.slice(0, 16)}...`);
  console.log(`[discord]   body:    ${JSON.stringify(req.body).slice(0, 200)}`);

  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;

  if (!signature || !timestamp) {
    console.warn('[discord] Rejected: missing signature headers');
    return res.status(401).send('Missing signature headers');
  }

  if (!verifyDiscordSignature(PUBLIC_KEY, (req as any).rawBody, signature, timestamp)) {
    console.warn('[discord] Rejected: invalid Ed25519 signature');
    return res.status(401).send('Invalid request signature');
  }

  console.log('[discord] Signature OK');

  const { type, data, member } = req.body;

  if (type === 0) {
    console.log('[discord] PING from Webhook Events — responding 204');
    return res.status(204).send();
  }

  if (type === 1 && !req.body.event) {
    console.log('[discord] PING from Interactions — responding {type:1}');
    return res.status(200).json({ type: 1 });
  }

  if (type === 2 && data?.name === 'standup') {
    const opts = Object.fromEntries((data.options || []).map((o: any) => [o.name, o.value]));
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
    } catch (err: any) {
      console.error('[discord] DB error saving standup:', err.message);
      return res.status(200).json({
        type: 4,
        data: { content: 'Something went wrong saving your standup. Please try again.', flags: 64 },
      });
    }
  }

  if (type === 1 && req.body.event) {
    console.log(`[discord] Webhook event received: ${req.body.event?.type} — no action needed`);
    return res.status(204).send();
  }

  console.log(`[discord] Unhandled type=${type}, ignoring`);
  return res.status(204).send();
};

export const handleInternalStandup = async (req: Request, res: Response) => {
  console.log('[discord-internal] ← Incoming standup submission from bot');

  const INTERNAL_TOKEN = process.env.DISCORD_INTERNAL_TOKEN;
  if (!INTERNAL_TOKEN) {
    console.error('[discord-internal] DISCORD_INTERNAL_TOKEN not set in .env');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }
  if (req.headers['x-internal-token'] !== INTERNAL_TOKEN) {
    console.warn('[discord-internal] Rejected: wrong internal token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { discordName, workedOn, completed, inProgress, nextUp, blockers, links } = req.body;
  console.log(`[discord-internal] discordName="${discordName}" workedOn="${workedOn?.slice(0, 40)}..." completed="${completed?.slice(0, 40)}..."`);

  if (!discordName || !workedOn || !completed) {
    return res.status(400).json({ error: 'Missing required fields: discordName, workdeOn, completed' });
  }

  try {
    const employee = await findEmployeeByDiscordName(discordName);
    if (!employee) {
      console.warn(`[discord-internal] No employee matched for "${discordName}" — set their discord_username in the HR platform`);
      return res.status(404).json({ error: `No employee found matching "${discordName}". Set the discord_username field on their employee profile.` });
    }

    await saveStandup(employee.id, workedOn, completed, inProgress, nextUp, blockers, links);
    console.log(`[discord-internal] ✔ Standup saved — ${employee.name} (id ${employee.id})`);
    return res.json({ success: true, employee: employee.name });
  } catch (err: any) {
    console.error('[discord-internal] DB error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }
};
