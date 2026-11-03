import { eq, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../config/database';
import { policyAcknowledgements, policies, employees } from '../../drizzle/schema';

const policyAcknowledgementsColumns = {
  id: policyAcknowledgements.id,
  policy_id: policyAcknowledgements.policyId,
  employee_id: policyAcknowledgements.employeeId,
  signed_file_path: policyAcknowledgements.signedFilePath,
  status: policyAcknowledgements.status,
  rejection_reason: policyAcknowledgements.rejectionReason,
  submitted_at: policyAcknowledgements.submittedAt,
  reviewed_by: policyAcknowledgements.reviewedBy,
  reviewed_at: policyAcknowledgements.reviewedAt,
};

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
    .select(policyAcknowledgementsColumns)
    .from(policyAcknowledgements)
    .where(and(eq(policyAcknowledgements.policyId, Number(policyId)), eq(policyAcknowledgements.employeeId, Number(employeeId))))
    .limit(1);
  return rows[0] || null;
}

export async function listForEmployee(employeeId: number | string) {
  return db
    .select({
      ...policyAcknowledgementsColumns,
      policy_title: policies.title,
      policy_type: policies.type,
      policy_category: policies.category,
    })
    .from(policyAcknowledgements)
    .innerJoin(policies, eq(policyAcknowledgements.policyId, policies.id))
    .where(eq(policyAcknowledgements.employeeId, Number(employeeId)));
}

export async function listForPolicy(policyId: number | string) {
  return db
    .select({
      ...policyAcknowledgementsColumns,
      employee_name: employees.name,
      employee_email: employees.email,
    })
    .from(policyAcknowledgements)
    .innerJoin(employees, eq(policyAcknowledgements.employeeId, employees.id))
    .where(eq(policyAcknowledgements.policyId, Number(policyId)))
    .orderBy(desc(policyAcknowledgements.submittedAt));
}

export async function findById(id: number | string) {
  const rows = await db.select(policyAcknowledgementsColumns).from(policyAcknowledgements).where(eq(policyAcknowledgements.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function review(id: number | string, { status, rejectionReason, reviewedBy }: any) {
  await db
    .update(policyAcknowledgements)
    .set({ status, rejectionReason: rejectionReason || null, reviewedBy, reviewedAt: new Date() })
    .where(eq(policyAcknowledgements.id, Number(id)));
}
