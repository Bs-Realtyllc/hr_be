import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../config/database';
import { serviceCredentials } from '../models';

export async function findByEmployeeId(employeeId: number | string) {
  return db
    .select({
      service_name: serviceCredentials.service_name,
      username: serviceCredentials.username,
      notes: serviceCredentials.notes,
      updated_at: serviceCredentials.updated_at,
    })
    .from(serviceCredentials)
    .where(eq(serviceCredentials.employee_id, Number(employeeId)));
}

export async function upsert(
  employeeId: number | string,
  { service_name, username, password, notes }: any,
  actorId: number | null = null
) {
  await db.execute(sql`
    INSERT INTO service_credentials (employee_id, service_name, username, password, notes, created_by, updated_by, created_at)
    VALUES (${Number(employeeId)}, ${service_name}, ${username}, ${password}, ${notes}, ${actorId}, ${actorId}, NOW())
    ON DUPLICATE KEY UPDATE
      username = VALUES(username),
      password = IF(VALUES(password) != '', VALUES(password), password),
      notes    = VALUES(notes),
      updated_by = ${actorId}
  `);
}
