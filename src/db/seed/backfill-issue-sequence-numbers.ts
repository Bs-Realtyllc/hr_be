// One-off: assigns a real sequence_number to every pre-existing issue that
// still has the migration's default of 0 (companion to
// backfill-project-codes.ts — that one backfilled projects.code, this one
// was missed in the same pass). Orders each project's issues by id (a safe
// proxy for creation order) and numbers them 1..N, then advances that
// project's issue_counter to match so future creates continue from there.
// Safe to re-run — it only ever touches rows where sequence_number = 0.
import 'dotenv/config';
import { eq, asc } from 'drizzle-orm';
import { db, pool } from '../../config/database';
import { issues, projects } from '../../../drizzle/schema';

async function main() {
  const rows = await db
    .select({ id: issues.id, projectId: issues.projectId })
    .from(issues)
    .where(eq(issues.sequenceNumber, 0))
    .orderBy(asc(issues.projectId), asc(issues.id));

  const byProject = new Map<number, number[]>();
  for (const row of rows) {
    const list = byProject.get(row.projectId) ?? [];
    list.push(row.id);
    byProject.set(row.projectId, list);
  }

  for (const [projectId, issueIds] of byProject) {
    let counter = 0;
    for (const issueId of issueIds) {
      counter += 1;
      await db.update(issues).set({ sequenceNumber: counter }).where(eq(issues.id, issueId));
    }
    await db.update(projects).set({ issueCounter: counter }).where(eq(projects.id, projectId));
    console.log(`Project ${projectId}: numbered ${counter} issue(s).`);
  }

  console.log(`Backfilled ${byProject.size} project(s).`);
  await pool.end();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
