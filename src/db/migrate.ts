// One-shot migration runner.
// Applies schema.sql (idempotent — CREATE TABLE IF NOT EXISTS) plus every
// migrate_*.sql file in this folder, in filename order. Safe to re-run:
// statements that fail because the change was already applied (duplicate
// column/key/entry) are skipped with a note instead of aborting the run.
import fs from 'fs';
import path from 'path';
import mysql, { Connection } from 'mysql2/promise';
import 'dotenv/config';

const SKIPPABLE_CODES = new Set([
  'ER_DUP_FIELDNAME', // column already exists
  'ER_DUP_KEYNAME', // index/key already exists
  'ER_DUP_ENTRY', // row already seeded
  'ER_TABLE_EXISTS_ERROR',
]);

function stripComments(sql: string): string {
  return sql
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');
}

function splitStatements(sql: string): string[] {
  return stripComments(sql)
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function runFile(conn: Connection, filePath: string): Promise<boolean> {
  const label = path.basename(filePath);
  const statements = splitStatements(fs.readFileSync(filePath, 'utf8'));
  let applied = 0,
    skipped = 0,
    failed = 0;

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      applied++;
    } catch (err: any) {
      if (SKIPPABLE_CODES.has(err.code)) {
        skipped++;
      } else {
        failed++;
        console.error(`  [FAIL] ${label}: ${err.message}`);
        console.error(`         statement: ${stmt.slice(0, 100)}${stmt.length > 100 ? '…' : ''}`);
      }
    }
  }
  console.log(`  ${label}: ${applied} applied, ${skipped} already-applied`);
  return failed === 0;
}

(async () => {
  // Connect without a database first — it may not exist yet on a fresh server.
  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await bootstrap.end();
  console.log(`Database "${process.env.DB_NAME}": ready`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Applying schema.sql…');
  // Always run schema.sql (it's self-idempotent via CREATE TABLE IF NOT EXISTS)
  // — not gated behind schema_migrations, to preserve current behavior exactly.
  await runFile(conn, path.join(__dirname, 'schema.sql'));

  // schema_migrations may not exist yet on a pre-tracking database — the file
  // that creates it (migrate_normalize_employees_p1.sql) runs through the same
  // untracked path below on its first pass, same as every migration before it.
  let appliedSet = new Set<string>();
  try {
    const [rows]: any = await conn.query('SELECT filename FROM schema_migrations');
    appliedSet = new Set(rows.map((r: any) => r.filename));
  } catch (err: any) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }

  const migrationFiles = fs
    .readdirSync(__dirname)
    .filter((f) => f.startsWith('migrate_') && f.endsWith('.sql'))
    .sort();

  console.log(`Applying ${migrationFiles.length} migration file(s)…`);
  for (const file of migrationFiles) {
    if (appliedSet.has(file)) {
      console.log(`  ${file}: already applied, skipping`);
      continue;
    }
    const ok = await runFile(conn, path.join(__dirname, file));
    if (ok) {
      // Table may not exist yet on the very first file that creates it — that
      // file's own INSERT IGNORE seeds its own name, so this becomes a no-op then.
      try {
        await conn.query('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [file]);
      } catch (err: any) {
        if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
      }
    }
  }

  console.log('Done.');
  await conn.end();
})().catch((err) => {
  console.error('Migration run aborted:', err.message);
  process.exit(1);
});
