// One-off: sets `code` on every existing project that doesn't have one yet,
// using the exact same derivation logic applied to new projects going forward
// (see project.service.ts). Run once after the issue-keys migration lands;
// safe to re-run — it only ever touches rows where code IS NULL.
import 'dotenv/config';
import { eq, isNull } from 'drizzle-orm';
import { db, pool } from '../../config/database';
import { projects } from '../../../drizzle/schema';
import { deriveProjectCode, ensureUniqueCode } from '../../services/project.service';

async function main() {
  const rows = await db.select({ id: projects.id, name: projects.name }).from(projects).where(isNull(projects.code));

  for (const row of rows) {
    const code = await ensureUniqueCode(deriveProjectCode(row.name));
    await db.update(projects).set({ code }).where(eq(projects.id, row.id));
    console.log(`Project ${row.id} (${row.name}) -> ${code}`);
  }

  console.log(`Backfilled ${rows.length} project(s).`);
  await pool.end();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
