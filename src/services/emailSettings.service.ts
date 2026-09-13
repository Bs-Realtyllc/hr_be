import * as emailSettingsRepo from '../repositories/emailSettings.repository';
import AppError from '../pkg/AppError';
import type { EmailSettingsSaveInput } from '../dtos/emailSettings.dto';

export async function get(employeeId: string) {
  return emailSettingsRepo.findPublicByEmployeeId(employeeId);
}

export async function save(employeeId: string, data: EmailSettingsSaveInput, actorId: number | null) {
  if(employeeId !== String(actorId)) throw new AppError('Cannot set email settings of other users.', 403);
  
  const existing = await emailSettingsRepo.findFullByEmployeeId(employeeId);

  if (!existing && !data.smtp_pass) {
    throw new AppError('Password is required for initial setup', 400);
  }

  if (data.smtp_pass) {
    await emailSettingsRepo.upsertWithPassword(employeeId, data, actorId);
    testSmtpAsync(data.smtp_host, data.smtp_port, data.smtp_user, data.smtp_pass);
  } else {
    await emailSettingsRepo.updateWithoutPassword(employeeId, data, actorId);
  }
}

async function testSmtpAsync(host: string, port: number, user: string, pass: string) {
  const nodemailer = require('nodemailer');
  try {
    const t = nodemailer.createTransport({ host, port: +port, secure: +port === 465, auth: { user, pass } });
    await t.verify();
    console.log(`[email] SMTP OK — ${user}@${host}:${port}`);
  } catch (err: any) {
    console.error(`[email] SMTP test failed — ${err.message}`);
  }
}
