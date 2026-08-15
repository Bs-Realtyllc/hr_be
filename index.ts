import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { sql } from 'drizzle-orm';
import swaggerSpec from './src/swagger';
import routes from './src/routes';
import legacyDb from './src/db';
import { db } from './src/config/database';
import { renewWebhookChannelIfNeeded } from './src/services/googleCalendar';
import weeklyReminder from './src/services/weeklyReminder';
import errorHandler from './src/middleware/errorHandler';

// ── Env validation ────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✘ Missing required env vars: ${missing.join(', ')}`);
  console.error('  Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const ENV = {
  PORT: process.env.PORT || '6002',
  DB_HOST: process.env.DB_HOST as string,
  DB_PORT: process.env.DB_PORT || '3306',
  DB_USER: process.env.DB_USER as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  DB_NAME: process.env.DB_NAME as string,
};

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();

// Standard security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
// CSP is off — this is a JSON API + Swagger docs page, not an HTML app rendering
// untrusted content, and the default CSP blocks Swagger UI's inline scripts.
// crossOriginResourcePolicy is relaxed so uploaded files (profile pictures,
// policy PDFs) can still be loaded by the separate frontend origin below.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({ origin: process.env.FRONTEND_URL }));
// process.cwd() (not __dirname) — __dirname would resolve under dist/ once
// compiled, but uploads/ lives at the project root alongside dist/, not inside it.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// 1mb covers every legitimate JSON payload in this API (largest are structured
// objects like tech_stack/category_ratings, never raw file bytes — those go
// through multer's own per-route limits in policies/profile/reports/weeklyReports
// routes instead). Explicit rather than relying on express's undocumented 100kb
// default, and still small enough to blunt oversized-body DoS attempts.
app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
}));

app.use('/api', routes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Must be registered after all routes/middleware — Express recognizes an error
// handler by its 4-argument signature and only invokes it via next(err).
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Legacy mysql2 pool — still the only DB access path for every domain not
    // yet converted to Sequelize. Kept alongside `sequelize` (below) until the
    // whole app has migrated; both point at the same database.
    const conn = await legacyDb.getConnection();
    console.log(`✔ Database connected  →  ${ENV.DB_HOST}:${ENV.DB_PORT} / ${ENV.DB_NAME}`);
    conn.release();

    await db.execute(sql`SELECT 1`);
    console.log('✔ Drizzle connected   →  ' + ENV.DB_NAME);
  } catch (err: any) {
    console.error('✘ Database connection failed');
    console.error(`  Host     : ${ENV.DB_HOST}:${ENV.DB_PORT}`);
    console.error(`  Database : ${ENV.DB_NAME}`);
    console.error(`  User     : ${ENV.DB_USER}`);
    console.error(`  Error    : ${err.message}`);
    process.exit(1);
  }

  app.listen(ENV.PORT, () => {
    console.log(`✔ Backend running     →  http://localhost:${ENV.PORT}`);
    console.log(`✔ Swagger UI          →  http://localhost:${ENV.PORT}/api/swagger`);
  });

  // Renew Google push-notification channel if it's expiring within 24 h.
  // Runs once on startup; also set a daily interval for long-running servers.
  renewWebhookChannelIfNeeded().catch((err: Error) => console.warn('[google] Channel renewal skipped:', err.message));
  setInterval(() => {
    renewWebhookChannelIfNeeded().catch((err: Error) => console.warn('[google] Channel renewal failed:', err.message));
  }, 12 * 60 * 60 * 1000); // every 12 hours

  weeklyReminder.start();
}

start();
