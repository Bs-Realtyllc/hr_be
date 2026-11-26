import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { documentAcknowledgements, documents, employees } from '../../drizzle/schema';

const ackColumns = {
  id: documentAcknowledgements.id,
  documentId: documentAcknowledgements.documentId,
  employeeId: documentAcknowledgements.employeeId,
  signedFilePath: documentAcknowledgements.signedFilePath,
  status: documentAcknowledgements.status,
  rejectionReason: documentAcknowledgements.rejectionReason,
  submittedAt: documentAcknowledgements.submittedAt,
  reviewedBy: documentAcknowledgements.reviewedBy,
  reviewedAt: documentAcknowledgements.reviewedAt,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function upsertSubmission({
  documentId,
  employeeId,
  signedFilePath,
}: {
  documentId: number;
  employeeId: number;
  signedFilePath: string | null;
}) {
  await db.execute(sql`
    INSERT INTO document_acknowledgements (document_id, employee_id, signed_file_path, status, rejection_reason, submitted_at)
    VALUES (${documentId}, ${employeeId}, ${signedFilePath}, 'pending', NULL, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      signed_file_path = VALUES(signed_file_path),
      status           = 'pending',
      rejection_reason = NULL,
      submitted_at     = CURRENT_TIMESTAMP,
      reviewed_by      = NULL,
      reviewed_at      = NULL
  `);
}

export async function findById(id: number | string) {
  const rows = await db
    .select(ackColumns)
    .from(documentAcknowledgements)
    .where(eq(documentAcknowledgements.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function findByDocumentAndEmployee(documentId: number | string, employeeId: number | string) {
  const rows = await db
    .select(ackColumns)
    .from(documentAcknowledgements)
    .where(
      and(
        eq(documentAcknowledgements.documentId, Number(documentId)),
        eq(documentAcknowledgements.employeeId, Number(employeeId)),
      ),
    )
    .limit(1);
  return rows[0] || null;
}

export async function listForEmployee(employeeId: number | string) {
  return db
    .select({
      ...ackColumns,
      document_title: documents.title,
      document_type: documents.documentType,
      document_category: documents.category,
    })
    .from(documentAcknowledgements)
    .innerJoin(documents, eq(documentAcknowledgements.documentId, documents.id))
    .where(eq(documentAcknowledgements.employeeId, Number(employeeId)))
    .orderBy(desc(documentAcknowledgements.submittedAt));
}

export async function listForDocument(documentId: number | string) {
  return db
    .select({
      ...ackColumns,
      employee_name: employees.name,
      employee_email: employees.email,
    })
    .from(documentAcknowledgements)
    .innerJoin(employees, eq(documentAcknowledgements.employeeId, employees.id))
    .where(eq(documentAcknowledgements.documentId, Number(documentId)))
    .orderBy(desc(documentAcknowledgements.submittedAt));
}

export async function listAll() {
  return db
    .select({
      ...ackColumns,
      document_title: documents.title,
      document_type: documents.documentType,
      employee_name: employees.name,
      employee_email: employees.email,
    })
    .from(documentAcknowledgements)
    .innerJoin(documents, eq(documentAcknowledgements.documentId, documents.id))
    .innerJoin(employees, eq(documentAcknowledgements.employeeId, employees.id))
    .orderBy(desc(documentAcknowledgements.submittedAt));
}

export async function review(
  id: number | string,
  { status, rejectionReason, reviewedBy }: { status: 'approved' | 'rejected'; rejectionReason: string | null; reviewedBy: number },
) {
  await db
    .update(documentAcknowledgements)
    .set({ status, rejectionReason: rejectionReason ?? null, reviewedBy, reviewedAt: new Date() })
    .where(eq(documentAcknowledgements.id, Number(id)));
}
