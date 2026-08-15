require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger');
const routes = require('./src/routes');
const db = require('./src/db');
const { renewWebhookChannelIfNeeded } = require('./src/services/googleCalendar');
const weeklyReminder = require('./src/services/weeklyReminder');
const errorHandler = require('./src/middleware/errorHandler');

// ── Env validation ────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`✘ Missing required env vars: ${missing.join(', ')}`);
  console.error('  Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const ENV = {
  PORT:        process.env.PORT        || '6002',
  DB_HOST:     process.env.DB_HOST,
  DB_PORT:     process.env.DB_PORT     || '3306',
  DB_USER:     process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME:     process.env.DB_NAME,
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 1mb covers every legitimate JSON payload in this API (largest are structured
// objects like tech_stack/category_ratings, never raw file bytes — those go
// through multer's own per-route limits in policies/profile/reports/weeklyReports
// routes instead). Explicit rather than relying on express's undocumented 100kb
// default, and still small enough to blunt oversized-body DoS attempts.
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));

app.use('/api', routes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/swagger/index.json', (req, res) => res.json(swaggerSpec));

// Must be registered after all routes/middleware — Express recognizes an error
// handler by its 4-argument signature and only invokes it via next(err).
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    const conn = await db.getConnection();
    console.log(`✔ Database connected  →  ${ENV.DB_HOST}:${ENV.DB_PORT} / ${ENV.DB_NAME}`);
    conn.release();
  } catch (err) {
    console.error('✘ Database connection failed');
    console.error(`  Host     : ${ENV.DB_HOST}:${ENV.DB_PORT}`);
    console.error(`  Database : ${ENV.DB_NAME}`);
    console.error(`  User     : ${ENV.DB_USER}`);
    console.error(`  Error    : ${err.message}`);
    process.exit(1);
  }

  app.listen(ENV.PORT, () => {
    console.log(`✔ Backend running     →  http://localhost:${ENV.PORT}`);
    console.log(`✔ Swagger UI          →  http://localhost:${ENV.PORT}/api/swagger/index.html`);
  });

  // Renew Google push-notification channel if it's expiring within 24 h.
  // Runs once on startup; also set a daily interval for long-running servers.
  renewWebhookChannelIfNeeded().catch(err => console.warn('[google] Channel renewal skipped:', err.message));
  setInterval(() => {
    renewWebhookChannelIfNeeded().catch(err => console.warn('[google] Channel renewal failed:', err.message));
  }, 12 * 60 * 60 * 1000); // every 12 hours

  weeklyReminder.start();
}

start();
