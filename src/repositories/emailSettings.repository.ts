import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { emailSettings } from '../models';

export async function findPublicByEmployeeId(employeeId: number | string) {
  const rows = await db
    .select({
      smtp_host: emailSettings.smtp_host,
      smtp_port: emailSettings.smtp_port,
      smtp_user: emailSettings.smtp_user,
      smtp_from: emailSettings.smtp_from,
      default_to: emailSettings.default_to,
      default_cc: emailSettings.default_cc,
      default_bcc: emailSettings.default_bcc,
    })
    .from(emailSettings)
    .where(eq(emailSettings.employee_id, Number(employeeId)))
    .limit(1);
  return rows[0] || null;
}

export async function findFullByEmployeeId(employeeId: number | string) {
  const rows = await db.select().from(emailSettings).where(eq(emailSettings.employee_id, Number(employeeId))).limit(1);
  return rows[0] || null;
}

export async function upsertWithPassword(employeeId: number | string, data: any, actorId: number | null = null) {
  await db.execute(sql`
    INSERT INTO email_settings
      (employee_id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, default_to, default_cc, default_bcc, created_by, updated_by)
    VALUES (${Number(employeeId)}, ${data.smtp_host}, ${data.smtp_port}, ${data.smtp_user}, ${data.smtp_pass},
            ${data.smtp_from}, ${data.default_to}, ${data.default_cc}, ${data.default_bcc}, ${actorId}, ${actorId})
    ON DUPLICATE KEY UPDATE
      smtp_host = VALUES(smtp_host), smtp_port = VALUES(smtp_port),
      smtp_user = VALUES(smtp_user), smtp_pass = VALUES(smtp_pass),
      smtp_from = VALUES(smtp_from), default_to = VALUES(default_to),
      default_cc = VALUES(default_cc), default_bcc = VALUES(default_bcc),
      updated_by = ${actorId}
  `);
}

export async function updateWithoutPassword(employeeId: number | string, data: any, actorId: number | null = null) {
  await db
    .update(emailSettings)
    .set({
      smtp_host: data.smtp_host,
      smtp_port: data.smtp_port,
      smtp_user: data.smtp_user,
      smtp_from: data.smtp_from,
      default_to: data.default_to,
      default_cc: data.default_cc,
      default_bcc: data.default_bcc,
      updated_by: actorId,
    })
    .where(eq(emailSettings.employee_id, Number(employeeId)));
}
