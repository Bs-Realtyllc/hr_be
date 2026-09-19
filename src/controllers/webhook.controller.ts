import { Request, Response } from "express";
import crypto from "crypto";
const leaveEvents = require("../services/leaveEvents");
import asyncHandler from "../middleware/asyncHandler";

import * as webhookService from "../services/webhook.service";

const EVENT_HANDLERS: Record<
  string,
  Record<string, (payload: any) => Promise<void>>
> = {
  n8n: {
    leave_approved: leaveEvents.handleLeaveApproved,
  },
};

const processedEvents = new Set<string>();

export const verify = (req: Request, res: Response) => {
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

export const receive = async (req: Request, res: Response) => {
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

  if (body.threadId) {
    const dedupeKey = `${service}:${eventType}:${body.threadId}`;
    if (processedEvents.has(dedupeKey)) {
      return res.status(200).json({ status: "already processed" });
    }
    processedEvents.add(dedupeKey);
  }

  res.status(200).json({ received: true });

  setImmediate(() => {
    dispatchEvent(service, eventType, body).catch((err: any) => {
      console.error(
        `[webhook:${service}] Error processing event "${eventType}":`,
        err.message,
      );
    });
  });
};

async function dispatchEvent(service: string, eventType: string, payload: any) {
  const handler = EVENT_HANDLERS[service]?.[eventType];
  if (!handler) {
    console.log(
      `[webhook:${service}] No handler registered for event "${eventType}" — ignoring`,
    );
    return;
  }
  await handler(payload);
}

export const month_end_report = asyncHandler(
  async (req: Request, res: Response) => {
    const expectedSecret = process.env.WEBHOOK_TRIGGER_SECRET;
    if (!expectedSecret || req.headers["x-webhook-secret"] !== expectedSecret) {
      console.warn("[webhook] month-end-report rejected: missing/invalid x-webhook-secret");
      return res.status(401).json({ error: "unauthorized" });
    }
    
    if (!process.env.HMAC_SECRET) {
      console.error("[webhook] HMAC_SECRET is not set in .env");
      return res.status(500).json({ description: "Webhook not configured" });
    }

    //leave-report
    const leave = await webhookService.leave_report();
    //performance-report
    const performance = await webhookService.performance_report();
    //financial-report
    const financial = await webhookService.financial_report();

    const signature = crypto
      .createHmac("sha256", process.env.HMAC_SECRET)
      .update(JSON.stringify({performance, leave, financial}))
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
          body: JSON.stringify({performance, leave, financial}),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null); // guard against non-JSON responses
        throw {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        };
      }
      res
        .status(200)
        .json({ description: "sucessfully send data to n8n webhook" });
    } catch (err: any) {
      console.log(
        "Error in sending request to n8n workflow",
        err.message ?? err.body,
      );

      if (err.status) {
        return res.status(502).json({
          description: "n8n webhook returned an error",
          status: err.status,
          statusText: err.statusText,
          n8nError: err.body, // now contains { error: "Invalid credentials" }
        });
      }
      return res.status(503).json({
        description: "Error in sending request to n8n workflow",
      });
    }
  },
);
