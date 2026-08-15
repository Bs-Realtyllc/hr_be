import { eq, and, desc, asc, getTableColumns } from 'drizzle-orm';
import { db } from '../config/database';
import { policies, employeesFlat } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function create({ type, title, filePath, version, uploadedBy, category }: any) {
  const result = await db.insert(policies).values({
    type,
    title,
    file_path: filePath,
    version,
    uploaded_by: uploadedBy,
    category,
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function findActiveByType(type: string) {
  const rows = await db
    .select()
    .from(policies)
    .where(and(eq(policies.type, type), eq(policies.is_active, true)))
    .orderBy(desc(policies.version))
    .limit(1);
  return rows[0] || null;
}

export async function findById(id: number | string) {
  const rows = await db.select().from(policies).where(eq(policies.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function listActive(category?: string) {
  const conditions = [eq(policies.is_active, true)];
  if (category !== undefined) conditions.push(eq(policies.category, category));

  return db
    .select({
      ...getTableColumns(policies),
      uploaded_by_name: employeesFlat.name,
    })
    .from(policies)
    .leftJoin(employeesFlat, eq(policies.uploaded_by, employeesFlat.id))
    .where(and(...conditions))
    .orderBy(desc(policies.is_pinned), asc(policies.type), desc(policies.version));
}

export async function deactivateByType(type: string) {
  await db.update(policies).set({ is_active: false }).where(eq(policies.type, type));
}

export async function remove(id: number | string) {
  await db.delete(policies).where(eq(policies.id, Number(id)));
}

export async function setPinned(id: number | string, pinned: boolean) {
  await db.update(policies).set({ is_pinned: pinned }).where(eq(policies.id, Number(id)));
}
