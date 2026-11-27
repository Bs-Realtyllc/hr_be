import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../config/database';
import { documents, employees } from '../../drizzle/schema';

const documentColumns = {
  id: documents.id,
  type: documents.type,
  documentType: documents.documentType,
  title: documents.title,
  filePath: documents.filePath,
  uploadedBy: documents.uploadedBy,
  isActive: documents.isActive,
  requiresAcknowledgement: documents.requiresAcknowledgement,
  category: documents.category,
  sizeBytes: documents.sizeBytes,
  isPinned: documents.isPinned,
  parentId: documents.parentId,
  createdAt: documents.createdAt,
  updatedAt: documents.updatedAt,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function create({
  type,
  documentType,
  title,
  filePath,
  uploadedBy,
  category,
  parentId,
  requiresAcknowledgement,
}: {
  type: string;
  documentType: string | null;
  title: string;
  filePath: string | null;
  uploadedBy: number;
  category: string | null;
  parentId: number | null;
  requiresAcknowledgement: boolean;
}) {
  const result = await db.insert(documents).values({
    type: type as any,
    documentType,
    title,
    filePath,
    uploadedBy,
    category,
    parentId,
    requiresAcknowledgement,
    createdAt: new Date(),
  });
  return insertedId(result);
}

export async function findById(id: number | string) {
  const rows = await db
    .select(documentColumns)
    .from(documents)
    .where(eq(documents.id, Number(id)))
    .limit(1);
  return rows[0] || null;
}

export async function listActive(parentId?: number | null, documentType?: string | null) {
  const conditions: any[] = [eq(documents.isActive, true)];

  if (parentId) {
    conditions.push(eq(documents.parentId, parentId));
  } else {
    conditions.push(isNull(documents.parentId));
  }

  if (documentType) {
    conditions.push(eq(documents.documentType, documentType));
  }

  return db
    .select({
      ...documentColumns,
      uploaded_by_name: employees.name,
    })
    .from(documents)
    .leftJoin(employees, eq(documents.uploadedBy, employees.id))
    .where(and(...conditions))
    .orderBy(documents.isPinned);
}

export async function remove(id: number | string) {
  await db.delete(documents).where(eq(documents.id, Number(id)));
}

export async function setPinned(id: number | string, pinned: boolean) {
  await db.update(documents).set({ isPinned: pinned }).where(eq(documents.id, Number(id)));
}

export async function rename(id: number | string, title: string) {
  const result: any = await db.update(documents).set({ title }).where(eq(documents.id, Number(id)));
  return (result[0]?.affectedRows ?? 0) > 0;
}

export async function getById(id: number) {
  const rows = await db.select(documentColumns).from(documents).where(eq(documents.id, id));
  return rows[0] || null;
}

export async function changeParentId(id: number, newParentId: number | null) {
  await db.update(documents).set({ parentId: newParentId }).where(eq(documents.id, id));
  return findById(id);
}
