import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { sql } from 'drizzle-orm';
import swaggerSpec from './src/swagger';
import routes from './src/routes';
import { db } from './src/config/database';
import { renewWebhookChannelIfNeeded } from './src/services/googleCalendar';
import * as weeklyReminder from './src/services/weeklyReminder';
import errorHandler from './src/middleware/errorHandler';
import { authenticate, requireRole } from './src/middleware/auth';

const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
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

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors());
app.use('/uploads',authenticate, requireRole('admin') ,express.static(path.join(process.cwd(), 'uploads')));
app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
}));

app.use('/api', routes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

async function start() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log(`✔ Database connected  →  ${ENV.DB_HOST}:${ENV.DB_PORT} / ${ENV.DB_NAME}`);
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

  renewWebhookChannelIfNeeded().catch((err: Error) => console.warn('[google] Channel renewal skipped:', err.message));
  setInterval(() => {
    renewWebhookChannelIfNeeded().catch((err: Error) => console.warn('[google] Channel renewal failed:', err.message));
  }, 12 * 60 * 60 * 1000);

  weeklyReminder.start();
}

start();
