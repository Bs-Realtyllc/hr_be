import nodemailer from 'nodemailer';
import * as policyRepo from '../repositories/policy.repository';
import * as employeeRepo from '../repositories/employee.repository';

export async function notifyRejection(ack: { employee_id: number; policy_id: number }, reason: string) {
  if (!process.env.MAIL_HOST) {
    console.info('[policy-ack] MAIL_HOST not set — skipping rejection email');
    return;
  }

  const [employee, policy]: [any, any] = await Promise.all([
    employeeRepo.findById(ack.employee_id),
    policyRepo.findById(ack.policy_id),
  ]);
  if (!employee?.email || !policy) return;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: employee.email,
    subject: `Your signed document was rejected — ${policy.title}`,
    html: `
      <p>Hi ${employee.name},</p>
      <p>Your signed copy of <strong>${policy.title}</strong> was rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please review the document and upload a corrected signed copy.</p>
      <p><a href="${process.env.FRONTEND_URL}/documents">Go to Documents & Signature</a></p>
      <p style="color:#888;font-size:12px">HR Platform</p>
    `,
  });
}
