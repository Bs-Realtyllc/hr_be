const leaveEvents = require('../services/leaveEvents');

const EVENT_HANDLERS = {
  n8n: {
    leave_in_progress: leaveEvents.handleLeaveInProgress,
  },
};

const processedEvents = new Set();

exports.verify = (req, res) => {
  const { service } = req.params;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[webhook:${service}] ← Verification GET (mode=${mode})`);

  if (!challenge) {
    return res.status(400).send('Missing hub.challenge');
  }

  const expectedToken = process.env[`WEBHOOK_VERIFY_TOKEN_${service.toUpperCase()}`];
  if (expectedToken && token !== expectedToken) {
    console.warn(`[webhook:${service}] Rejected: verify_token mismatch`);
    return res.status(403).send('Verification token mismatch');
  }

  console.log(`[webhook:${service}] Verified — echoing challenge`);
  return res.status(200).send(challenge);
};

exports.receive = async (req, res) => {
  const { service } = req.params;
  const body = req.body || {};

  if (body.type === 'url_verification' && body.challenge) {
    console.log(`[webhook:${service}] ← Verification POST — echoing challenge`);
    return res.status(200).json({ challenge: body.challenge });
  }

  const expectedSecret = process.env[`WEBHOOK_SECRET_${service.toUpperCase()}`];
  if (expectedSecret && req.headers['x-webhook-secret'] !== expectedSecret) {
    console.warn(`[webhook:${service}] Rejected: x-webhook-secret mismatch`);
    return res.status(401).json({ error: 'unauthorized' });
  }

  const eventType = body.event || body.type || 'unknown';
  console.log(`[webhook:${service}] ← Event "${eventType}"`);

  if (body.threadId && body.date) {
    const dedupeKey = `${service}:${eventType}:${body.threadId}:${body.date}`;
    if (processedEvents.has(dedupeKey)) {
      return res.status(200).json({ status: 'already processed' });
    }
    processedEvents.add(dedupeKey);
  }

  res.status(200).json({ received: true });

  setImmediate(() => {
    dispatchEvent(service, eventType, body).catch((err) => {
      console.error(`[webhook:${service}] Error processing event "${eventType}":`, err.message);
    });
  });
};

async function dispatchEvent(service, eventType, payload) {
  const handler = EVENT_HANDLERS[service]?.[eventType];
  if (!handler) {
    console.log(`[webhook:${service}] No handler registered for event "${eventType}" — ignoring`);
    return;
  }
  await handler(payload);
}
