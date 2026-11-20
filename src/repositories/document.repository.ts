import { eq, and, desc, asc, isNull } from 'drizzle-orm';
import { db } from '../config/database';
import { documents, employees } from '../../drizzle/schema';

const documentColumns = {
  id: documents.id,
  type: documents.type,
  title: documents.title,
  filePath: documents.filePath,
  uploadedBy: documents.uploadedBy,
  isActive: documents.isActive,
  category: documents.category,
  sizeBytes: documents.sizeBytes,
  isPinned: documents.isPinned,
  parentId: documents.parentId,
  createdAt: documents.createdAt,
  updatedAt: documents.updatedAt
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function create({ type, title, filePath, uploadedBy, category, parentId }: any) {
  const result = await db.insert(documents).values({
    type,
    title,
    filePath,
    uploadedBy,
    category,
    parentId: parentId,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

// export async function findActiveByType(type: 'file' | 'folder') {
//   const rows = await db
//     .select(documentColumns)
//     .from(documents)
//     .where(and(eq(documents.type, type), eq(documents.isActive, true)))
//     .orderBy(desc(documents.version))
//     .limit(1);
//   return rows[0] || null;
// }

export async function findById(id: number | string) {
  const rows = await db.select(documentColumns).from(documents).where(eq(documents.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function listActive(parentId?: number) {
  const conditions = [eq(documents.isActive, true)];
  // if (category !== undefined) conditions.push(eq(documents.category, category));
  if(parentId){
    conditions.push(eq(documents.parentId, parentId))
  }else{
    conditions.push(isNull(documents.parentId))
  }

  return db
    .select({
      ...documentColumns,
      uploaded_by_name: employees.name,
    })
    .from(documents)
    .leftJoin(employees, eq(documents.uploadedBy, employees.id))
    .where(and(...conditions))
    .orderBy(desc(documents.isPinned));
}

// export async function deactivateByType(type: string) {
//   await db.update(documents).set({ isActive: false }).where(eq(documents.type, type));
// }

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
  const result = await db.select(documentColumns).from(documents).where(eq(documents.id, id))
  return result[0];
}