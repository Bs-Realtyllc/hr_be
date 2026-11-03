import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { emailSettings } from '../../drizzle/schema';

const emailSettingsColumns = {
  id: emailSettings.id,
  employee_id: emailSettings.employeeId,
  smtp_host: emailSettings.smtpHost,
  smtp_port: emailSettings.smtpPort,
  smtp_user: emailSettings.smtpUser,
  smtp_pass: emailSettings.smtpPass,
  smtp_from: emailSettings.smtpFrom,
  default_to: emailSettings.defaultTo,
  default_cc: emailSettings.defaultCc,
  default_bcc: emailSettings.defaultBcc,
  created_at: emailSettings.createdAt,
  updated_at: emailSettings.updatedAt,
  created_by: emailSettings.createdBy,
  updated_by: emailSettings.updatedBy,
};

export async function findPublicByEmployeeId(employeeId: number | string) {
  const rows = await db
    .select({
      smtp_host: emailSettings.smtpHost,
      smtp_port: emailSettings.smtpPort,
      smtp_user: emailSettings.smtpUser,
      smtp_from: emailSettings.smtpFrom,
      default_to: emailSettings.defaultTo,
      default_cc: emailSettings.defaultCc,
      default_bcc: emailSettings.defaultBcc,
    })
    .from(emailSettings)
    .where(eq(emailSettings.employeeId, Number(employeeId)))
    .limit(1);
  return rows[0] || null;
}

export async function findFullByEmployeeId(employeeId: number | string) {
  const rows = await db.select(emailSettingsColumns).from(emailSettings).where(eq(emailSettings.employeeId, Number(employeeId))).limit(1);
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
      smtpHost: data.smtp_host,
      smtpPort: data.smtp_port,
      smtpUser: data.smtp_user,
      smtpFrom: data.smtp_from,
      defaultTo: data.default_to,
      defaultCc: data.default_cc,
      defaultBcc: data.default_bcc,
      updatedBy: actorId,
    })
    .where(eq(emailSettings.employeeId, Number(employeeId)));
}
