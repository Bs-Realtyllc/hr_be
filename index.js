require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger');
const routes = require('./src/routes');
const db = require('./src/db');

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

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:6001' }));
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));

app.use('/api', routes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/swagger/index.json', (req, res) => res.json(swaggerSpec));

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
    console.log(`✔ Swagger UI          →  http://localhost:${ENV.PORT}/api/docs`);
  });
}

start();
