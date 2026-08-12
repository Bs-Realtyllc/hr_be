const leaveEvents = require("../services/leaveEvents");
const leaveRequest = require("../models/LeaveRequest");
const crypto = require("crypto");
const { response } = require("express");

const EVENT_HANDLERS = {
  n8n: {
    leave_approved: leaveEvents.handleLeaveApproved,
  },
};

const processedEvents = new Set();

exports.verify = (req, res) => {
  const { service } = req.params;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log(`[webhook:${service}] ← Verification GET (mode=${mode})`);

  if (!challenge) {
    return res.status(400).send("Missing hub.challenge");
  }

  const expectedToken =
    process.env[`WEBHOOK_VERIFY_TOKEN_${service.toUpperCase()}`];
  if (expectedToken && token !== expectedToken) {
    console.warn(`[webhook:${service}] Rejected: verify_token mismatch`);
    return res.status(403).send("Verification token mismatch");
  }

  console.log(`[webhook:${service}] Verified — echoing challenge`);
  return res.status(200).send(challenge);
};

exports.receive = async (req, res) => {
  const { service } = req.params;
  const body = req.body || {};

  if (body.type === "url_verification" && body.challenge) {
    console.log(`[webhook:${service}] ← Verification POST — echoing challenge`);
    return res.status(200).json({ challenge: body.challenge });
  }

  const expectedSecret = process.env[`WEBHOOK_SECRET_${service.toUpperCase()}`];
  if (expectedSecret && req.headers["x-webhook-secret"] !== expectedSecret) {
    console.warn(`[webhook:${service}] Rejected: x-webhook-secret mismatch`);
    return res.status(401).json({ error: "unauthorized" });
  }

  const eventType = body.event || body.type || "unknown";
  console.log(`[webhook:${service}] ← Event "${eventType}"`);

  // Idempotency — same approval thread + same day shouldn't be processed twice.
  // threadId is used ONLY for this check; it's never passed on to a handler's business logic.
  if (body.threadId) {
    const dedupeKey = `${service}:${eventType}:${body.threadId}`;
    if (processedEvents.has(dedupeKey)) {
      return res.status(200).json({ status: "already processed" });
    }
    processedEvents.add(dedupeKey);
  }

  res.status(200).json({ received: true });

  setImmediate(() => {
    dispatchEvent(service, eventType, body).catch((err) => {
      console.error(
        `[webhook:${service}] Error processing event "${eventType}":`,
        err.message,
      );
    });
  });
};

async function dispatchEvent(service, eventType, payload) {
  const handler = EVENT_HANDLERS[service]?.[eventType];
  if (!handler) {
    console.log(
      `[webhook:${service}] No handler registered for event "${eventType}" — ignoring`,
    );
    return;
  }
  await handler(payload);
}

//month-end-report
exports.month_end_report = async (req, res) => {
  const data = await leaveRequest.findAllLeaveRequests();
  // console.log(payload)
  const signature = crypto
    .createHmac("sha256", process.env.HMAC_SECRET)
    .update(JSON.stringify(data)) // Data must be stringified
    .digest("hex");
  try {
    const response = await fetch(
      `${process.env.WEBHOOK_URL_N8N}/month-end-trigger`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-signature": signature,
        },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok)
      throw Error({ status: response.status, statusText: response.statusText });

    res.status(200).json({ description: "sucessfully send data to n8n webhook" });
    // console.log(response)
  } catch (err) {
    console.log("Error in sending request to n8n workflow", err.message);

    // only if the webhook throws error
    if (err.status) {
      return res.status(502).json({
        description: "n8n webhook returned an error",
        status: err.status,
        statusText: err.statusText,
      });
    }
    //if the fetch fails to find webhook in n8n cloud
    return res.status(503).json({
      description: "Error in sending request to n8n workflow",
    });
  }
};
