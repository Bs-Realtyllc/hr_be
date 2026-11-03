import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { policies, employees } from '../../drizzle/schema';

const policiesColumns = {
  id: policies.id,
  type: policies.type,
  title: policies.title,
  file_path: policies.filePath,
  version: policies.version,
  uploaded_by: policies.uploadedBy,
  is_active: policies.isActive,
  created_at: policies.createdAt,
  category: policies.category,
  is_pinned: policies.isPinned,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function create({ type, title, filePath, version, uploadedBy, category }: any) {
  const result = await db.insert(policies).values({
    type,
    title,
    filePath,
    version,
    uploadedBy,
    category,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function findActiveByType(type: string) {
  const rows = await db
    .select(policiesColumns)
    .from(policies)
    .where(and(eq(policies.type, type), eq(policies.isActive, true)))
    .orderBy(desc(policies.version))
    .limit(1);
  return rows[0] || null;
}

export async function findById(id: number | string) {
  const rows = await db.select(policiesColumns).from(policies).where(eq(policies.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function listActive(category?: string) {
  const conditions = [eq(policies.isActive, true)];
  if (category !== undefined) conditions.push(eq(policies.category, category));

  return db
    .select({
      ...policiesColumns,
      uploaded_by_name: employees.name,
    })
    .from(policies)
    .leftJoin(employees, eq(policies.uploadedBy, employees.id))
    .where(and(...conditions))
    .orderBy(desc(policies.isPinned), asc(policies.type), desc(policies.version));
}

export async function deactivateByType(type: string) {
  await db.update(policies).set({ isActive: false }).where(eq(policies.type, type));
}

export async function remove(id: number | string) {
  await db.delete(policies).where(eq(policies.id, Number(id)));
}

export async function setPinned(id: number | string, pinned: boolean) {
  await db.update(policies).set({ isPinned: pinned }).where(eq(policies.id, Number(id)));
}
