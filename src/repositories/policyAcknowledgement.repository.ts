import { eq, and, desc, getTableColumns } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../config/database';
import { policyAcknowledgements, policies, employeesFlat } from '../models';

// Same exported function names/signatures as the old src/models/PolicyAcknowledgement.js.

export async function upsertSubmission({ policyId, employeeId, signedFilePath }: any) {
  await db.execute(sql`
    INSERT INTO policy_acknowledgements (policy_id, employee_id, signed_file_path, status, rejection_reason, submitted_at)
    VALUES (${Number(policyId)}, ${Number(employeeId)}, ${signedFilePath}, 'pending', NULL, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      signed_file_path = VALUES(signed_file_path),
      status = 'pending',
      rejection_reason = NULL,
      submitted_at = CURRENT_TIMESTAMP,
      reviewed_by = NULL,
      reviewed_at = NULL
  `);
}

export async function findByPolicyAndEmployee(policyId: number | string, employeeId: number | string) {
  const rows = await db
    .select()
    .from(policyAcknowledgements)
    .where(and(eq(policyAcknowledgements.policy_id, Number(policyId)), eq(policyAcknowledgements.employee_id, Number(employeeId))))
    .limit(1);
  return rows[0] || null;
}

export async function listForEmployee(employeeId: number | string) {
  return db
    .select({
      ...getTableColumns(policyAcknowledgements),
      policy_title: policies.title,
      policy_type: policies.type,
      policy_category: policies.category,
    })
    .from(policyAcknowledgements)
    .innerJoin(policies, eq(policyAcknowledgements.policy_id, policies.id))
    .where(eq(policyAcknowledgements.employee_id, Number(employeeId)));
}

export async function listForPolicy(policyId: number | string) {
  return db
    .select({
      ...getTableColumns(policyAcknowledgements),
      employee_name: employeesFlat.name,
      employee_email: employeesFlat.email,
    })
    .from(policyAcknowledgements)
    .innerJoin(employeesFlat, eq(policyAcknowledgements.employee_id, employeesFlat.id))
    .where(eq(policyAcknowledgements.policy_id, Number(policyId)))
    .orderBy(desc(policyAcknowledgements.submitted_at));
}

export async function findById(id: number | string) {
  const rows = await db.select().from(policyAcknowledgements).where(eq(policyAcknowledgements.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function review(id: number | string, { status, rejectionReason, reviewedBy }: any) {
  await db
    .update(policyAcknowledgements)
    .set({ status, rejection_reason: rejectionReason || null, reviewed_by: reviewedBy, reviewed_at: new Date() })
    .where(eq(policyAcknowledgements.id, Number(id)));
}
