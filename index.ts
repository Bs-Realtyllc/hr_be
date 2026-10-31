import "dotenv/config";
import http from "http";
import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import morgan from "morgan";
import { enqueueAccessLog } from "./src/pkg/requestLogQueue";
import { attachInboxSocket } from "./src/ws/inboxSocket";
import { connectMongo } from "./src/config/mongodb";
import { ensureAudioBucket } from "./src/config/minio";

import { sql } from "drizzle-orm";
import swaggerSpec from "./src/swagger";
import routes from "./src/routes";
import { db } from "./src/config/database";
import { renewWebhookChannelIfNeeded } from "./src/services/googleCalendar";
import * as weeklyReminder from "./src/services/weeklyReminder";
import errorHandler from "./src/middleware/errorHandler";
import { authenticate, requireRole } from "./src/middleware/auth";
import { RequestContext } from "./src/pkg/requestContext";
import { trace } from "./src/middleware/trace";

const REQUIRED_ENV = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
  "TWO_FACTOR_ENCRYPTION_KEY",
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✘ Missing required env vars: ${missing.join(", ")}`);
  console.error("  Copy .env.example to .env and fill in the values.");
  process.exit(1);
}
if (process.env.TWO_FACTOR_ENCRYPTION_KEY!.length !== 64) {
  console.error("✘ TWO_FACTOR_ENCRYPTION_KEY must be a 64-char hex string (32 bytes).");
  console.error('  Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const ENV = {
  PORT: process.env.PORT || "6002",
  DB_HOST: process.env.DB_HOST as string,
  DB_PORT: process.env.DB_PORT || "3306",
  DB_USER: process.env.DB_USER as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  DB_NAME: process.env.DB_NAME as string,
};

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// morgan.token("employee_id", (req) => {
//   const id = req.user?.id;
//   return id != null ? String(id) : null;
// });
// morgan.token("trace_id", (req) => {
//   return req.trace_id;
// });

app.use(
  morgan(
    (tokens, req, res) => {
      const ctx = res.locals.ctx as RequestContext | undefined;

      enqueueAccessLog({
        traceId: ctx?.traceId ?? "-",
        employeeId: ctx?.employeeId ?? null,
        method: tokens.method(req, res),
        endpoint: tokens.url(req, res),
        responseStatus: Number(tokens.status(req, res)),
        responseDurationMs: Number(tokens["response-time"](req, res)),
        ipAddress: tokens["remote-addr"](req, res),
        requestTimestamp: new Date(),
        userAgent: tokens["user-agent"](req, res),
      });
      return null; // returning null/undefined suppresses Morgan's own console output
    },
    { skip: (req) => req.method === "OPTIONS" },
  ),
);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:6001',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

const uploadsDir = path.join(process.cwd(), "uploads");
//for profile images -- no auth
app.use(
  "/uploads/profile/photo",
  express.static(path.join(uploadsDir, "profile/photo")),
);
//for other docs --require auth
app.use("/uploads", authenticate, requireRole("admin"), express.static(uploadsDir));

app.use(
  express.json({
    limit: "1mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use("/api", trace, routes); 

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);
app.use("/api/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

async function start() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log(
      `✔ Database connected  →  ${ENV.DB_HOST}:${ENV.DB_PORT} / ${ENV.DB_NAME}`,
    );
  } catch (err: any) {
    console.error("✘ Database connection failed");
    console.error(`  Host     : ${ENV.DB_HOST}:${ENV.DB_PORT}`);
    console.error(`  Database : ${ENV.DB_NAME}`);
    console.error(`  User     : ${ENV.DB_USER}`);
    console.error(`  Error    : ${err.message}`);
    process.exit(1);
  }

  await connectMongo();
  await ensureAudioBucket().catch((err: Error) =>
    console.warn("[minio] Bucket init skipped:", err.message),
  );

  const httpServer = http.createServer(app);

  /* Attach Socket.IO for Inbox real-time events */
  const io = attachInboxSocket(httpServer);
  app.set('io', io);
  console.log(`✔ Inbox WebSocket     →  ws://localhost:${ENV.PORT}/ws/inbox`);

  httpServer.listen(ENV.PORT, () => {
    console.log(`✔ Backend running     →  http://localhost:${ENV.PORT}`);
    console.log(
      `✔ Swagger UI          →  http://localhost:${ENV.PORT}/api/swagger`,
    );
  });

  renewWebhookChannelIfNeeded().catch((err: Error) =>
    console.warn("[google] Channel renewal skipped:", err.message),
  );
  setInterval(
    () => {
      renewWebhookChannelIfNeeded().catch((err: Error) =>
        console.warn("[google] Channel renewal failed:", err.message),
      );
    },
    12 * 60 * 60 * 1000,
  );

  weeklyReminder.start();
}

start();
