// One-shot migration runner.
// Applies schema.sql (idempotent — CREATE TABLE IF NOT EXISTS) plus every
// migrate_*.sql file in this folder, in filename order. Safe to re-run:
// statements that fail because the change was already applied (duplicate
// column/key/entry) are skipped with a note instead of aborting the run.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const SKIPPABLE_CODES = new Set([
  'ER_DUP_FIELDNAME',   // column already exists
  'ER_DUP_KEYNAME',     // index/key already exists
  'ER_DUP_ENTRY',       // row already seeded
  'ER_TABLE_EXISTS_ERROR',
]);

function stripComments(sql) {
  return sql
    .split('\n')
    .map(line => {
      const idx = line.indexOf('--');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');
}

function splitStatements(sql) {
  return stripComments(sql)
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function runFile(conn, filePath) {
  const label = path.basename(filePath);
  const statements = splitStatements(fs.readFileSync(filePath, 'utf8'));
  let applied = 0, skipped = 0;

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      applied++;
    } catch (err) {
      if (SKIPPABLE_CODES.has(err.code)) {
        skipped++;
      } else {
        console.error(`  [FAIL] ${label}: ${err.message}`);
        console.error(`         statement: ${stmt.slice(0, 100)}${stmt.length > 100 ? '…' : ''}`);
      }
    }
  }
  console.log(`  ${label}: ${applied} applied, ${skipped} already-applied`);
}

(async () => {
  // Connect without a database first — it may not exist yet on a fresh server.
  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await bootstrap.end();
  console.log(`Database "${process.env.DB_NAME}": ready`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Applying schema.sql…');
  await runFile(conn, path.join(__dirname, 'schema.sql'));

  const migrationFiles = fs.readdirSync(__dirname)
    .filter(f => f.startsWith('migrate_') && f.endsWith('.sql'))
    .sort();

  console.log(`Applying ${migrationFiles.length} migration file(s)…`);
  for (const file of migrationFiles) {
    await runFile(conn, path.join(__dirname, file));
  }

  console.log('Done.');
  await conn.end();
})().catch(err => {
  console.error('Migration run aborted:', err.message);
  process.exit(1);
});
