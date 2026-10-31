/**
 * One-time MinIO setup script.
 * Connects to the remote MinIO instance, creates the inbox-audio bucket,
 * and verifies read/write access.
 *
 * Usage:
 *   npx tsx scripts/setup-minio.ts
 *
 * Reads config from environment variables (or .env via dotenv).
 */

import 'dotenv/config';
import { Client } from 'minio';

const ENDPOINT   = process.env.MINIO_ENDPOINT   || 'localhost';
const PORT       = Number(process.env.MINIO_PORT) || 9000;
const USE_SSL    = process.env.MINIO_USE_SSL === 'true';
const ACCESS_KEY = process.env.MINIO_ACCESS_KEY  || '';
const SECRET_KEY = process.env.MINIO_SECRET_KEY  || '';
const BUCKET     = process.env.MINIO_AUDIO_BUCKET || 'inbox-audio';

const client = new Client({
  endPoint:  ENDPOINT,
  port:      PORT,
  useSSL:    USE_SSL,
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
});

async function run() {
  const proto = USE_SSL ? 'https' : 'http';
  console.log(`\nConnecting to MinIO → ${proto}://${ENDPOINT}:${PORT}`);
  console.log(`Bucket              → ${BUCKET}\n`);

  /* ── 1. Check / create bucket ── */
  const exists = await client.bucketExists(BUCKET);
  if (exists) {
    console.log(`✔ Bucket "${BUCKET}" already exists`);
  } else {
    await client.makeBucket(BUCKET);
    console.log(`✔ Bucket "${BUCKET}" created`);
  }

  /* ── 2. Smoke-test: upload a tiny probe object ── */
  const probeKey     = '.setup-probe';
  const probeContent = Buffer.from('ok');
  await client.putObject(BUCKET, probeKey, probeContent, probeContent.length, {
    'Content-Type': 'text/plain',
  });
  console.log(`✔ Write test passed  → uploaded "${probeKey}"`);

  /* ── 3. Verify presigned URL generation ── */
  const url = await client.presignedGetObject(BUCKET, probeKey, 60);
  console.log(`✔ Presigned URL OK   → ${url.slice(0, 80)}…`);

  /* ── 4. Clean up probe ── */
  await client.removeObject(BUCKET, probeKey);
  console.log(`✔ Probe removed\n`);

  console.log('MinIO is ready. Update your .env with:');
  console.log(`  MINIO_ENDPOINT=${ENDPOINT}`);
  console.log(`  MINIO_PORT=${PORT}`);
  console.log(`  MINIO_USE_SSL=${USE_SSL}`);
  console.log(`  MINIO_AUDIO_BUCKET=${BUCKET}\n`);
}

run().catch(err => {
  console.error('\n✘ MinIO setup failed:', err.message);
  console.error('\nCommon causes:');
  console.error('  • Wrong MINIO_ENDPOINT / MINIO_PORT in .env');
  console.error('  • Wrong MINIO_ACCESS_KEY / MINIO_SECRET_KEY');
  console.error('  • Server firewall blocking port', PORT);
  process.exit(1);
});
