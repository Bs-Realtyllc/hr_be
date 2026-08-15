import cron from 'node-cron';
import nodemailer from 'nodemailer';
import * as employeeRepo from '../repositories/employee.repository';

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

function buildHtml(name: string, uploadUrl: string): string {
  return `
    <p>Hi ${name},</p>
    <p>It's Sunday — time to submit your <strong>weekly work update (PPT/PDF)</strong> for this past week.</p>
    <p><a href="${uploadUrl}" style="color:#4f46e5;font-weight:bold">Submit My Weekly Update</a></p>
    <p style="color:#888;font-size:12px">HR Platform</p>
  `;
}

export async function sendWeeklyReminders() {
  if (!process.env.MAIL_HOST) {
    console.info('[weekly-reminder] MAIL_HOST not set — skipping weekly PPT reminder email');
    return;
  }

  const uploadUrl = `${process.env.FRONTEND_URL}/weekly-reports`;
  const transporter = buildTransporter();

  let employees: any[];
  try {
    employees = await employeeRepo.findAllActive();
  } catch (err: any) {
    console.error('[weekly-reminder] Failed to load employees:', err.message);
    return;
  }

  const results = await Promise.allSettled(
    employees
      .filter((e) => e.email)
      .map((e) =>
        transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.MAIL_USER,
          to: e.email,
          subject: 'Weekly Work Update — Please Submit Your PPT',
          html: buildHtml(e.name, uploadUrl),
        })
      )
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`[weekly-reminder] Sent ${results.length - failed}/${results.length} weekly PPT reminder emails`);
}

export function start() {
  // Every Sunday at 10:00 AM server time.
  cron.schedule('0 10 * * 0', () => {
    sendWeeklyReminders().catch((err: any) => console.error('[weekly-reminder] Job failed:', err.message));
  });
  console.log('✔ Weekly PPT reminder scheduled  →  Sundays at 10:00 AM');
}
