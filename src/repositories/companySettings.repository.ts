import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { companySettings } from '../../drizzle/schema';

const columns = {
  name: companySettings.name,
  email: companySettings.email,
  website: companySettings.website,
  updated_at: companySettings.updatedAt,
};

// Singleton row — migration 0002 guarantees exactly one row always exists,
// so reads/writes never need an insert branch or a guess at which id to use.
export async function find() {
  const rows = await db.select(columns).from(companySettings).orderBy(companySettings.id).limit(1);
  return rows[0] || null;
}

export async function upsert(data: { name: string; email: string; website: string }, actorId: number | null) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: companySettings.id })
      .from(companySettings)
      .orderBy(companySettings.id)
      .limit(1)
      .for('update');

    await tx
      .update(companySettings)
      .set({ name: data.name, email: data.email, website: data.website, updatedBy: actorId })
      .where(eq(companySettings.id, row.id));
  });
}
