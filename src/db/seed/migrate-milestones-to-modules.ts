// One-off: Milestone was replaced by Module (real ownership via lead_id, a
// member subset via module_members, a start/target date range instead of a
// single due date). This copies every existing milestones row into modules,
// backfills issues.module_id from the old issues.milestone_id via the id
// mapping, and remaps project_assignments.role from the old free-form values
// to the new admin/member permission tiers (anything already 'lead' becomes
// 'admin'; everything else becomes 'member' — not named lead/contributor,
// since this app's global employee role already has a 'lead' value with
// real company-wide power that a project-scoped tier must not imply).
//
// Safe to re-run: no-ops if `modules` already has rows, since by then this
// has already completed. Run with: npx tsx src/db/seed/migrate-milestones-to-modules.ts
import 'dotenv/config';
import { eq, isNotNull } from 'drizzle-orm';
import { db, pool } from '../../config/database';
import { milestones, modules, issues, projectAssignments } from '../../../drizzle/schema';

const STATUS_MAP: Record<string, 'backlog' | 'in_progress' | 'completed'> = {
  pending: 'backlog',
  in_progress: 'in_progress',
  completed: 'completed',
};

async function main() {
  const existingModules = await db.select({ id: modules.id }).from(modules).limit(1);
  if (existingModules.length > 0) {
    console.log('modules already has rows — assuming this migration already ran. Exiting.');
    await pool.end();
    return;
  }

  const oldMilestones = await db.select().from(milestones);
  const idMap = new Map<number, number>();

  for (const m of oldMilestones) {
    const result = await db.insert(modules).values({
      projectId: m.projectId,
      name: m.title,
      targetDate: m.dueDate,
      status: STATUS_MAP[m.status ?? 'pending'] ?? 'backlog',
      companyId: m.companyId,
    });
    const newId = (result as any)[0].insertId as number;
    idMap.set(m.id, newId);
  }
  console.log(`Migrated ${oldMilestones.length} milestone(s) into modules.`);

  const issuesWithMilestone = await db
    .select({ id: issues.id, milestoneId: issues.milestoneId })
    .from(issues)
    .where(isNotNull(issues.milestoneId));
  let backfilled = 0;
  for (const issue of issuesWithMilestone) {
    const moduleId = idMap.get(issue.milestoneId!);
    if (moduleId == null) continue;
    await db.update(issues).set({ moduleId }).where(eq(issues.id, issue.id));
    backfilled += 1;
  }
  console.log(`Backfilled module_id on ${backfilled} issue(s).`);

  const assignments = await db.select().from(projectAssignments);
  let remapped = 0;
  for (const a of assignments) {
    const nextRole = a.role === 'lead' ? 'admin' : 'member';
    if (nextRole !== a.role) {
      await db.update(projectAssignments).set({ role: nextRole }).where(eq(projectAssignments.id, a.id));
      remapped += 1;
    }
  }
  console.log(`Remapped role on ${remapped} assignment(s) to admin/member.`);

  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
