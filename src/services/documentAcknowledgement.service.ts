import nodemailer from 'nodemailer';
import * as documentRepo from '../repositories/document.repository';
import * as employeeRepo from '../repositories/employee.repository';
import * as ackRepo from '../repositories/documentAcknowledgement.repository';
import AppError from '../pkg/AppError';

export async function submitAcknowledgement(
  documentId: number,
  employeeId: number,
  signedFilePath: string | null,
) {
  const document = await documentRepo.findById(documentId);
  if (!document) throw new AppError('Document not found', 404);
  if (document.type !== 'file') throw new AppError('Only a file document can be acknowledged', 400);

  await ackRepo.upsertSubmission({ documentId, employeeId, signedFilePath });
}

export async function myAcknowledgements(employeeId: number) {
  return ackRepo.listForEmployee(employeeId);
}

export async function listForDocument(documentId: string) {
  const document = await documentRepo.findById(documentId);
  if (!document) throw new AppError('Document not found', 404);
  return ackRepo.listForDocument(documentId);
}

export async function listAll() {
  return ackRepo.listAll();
}

export async function reviewAcknowledgement(
  ackId: string,
  status: 'approved' | 'rejected',
  rejectionReason: string | null,
  reviewedBy: number,
) {
  const ack = await ackRepo.findById(ackId);
  if (!ack) throw new AppError('Acknowledgement not found', 404);
  if (ack.status !== 'pending') throw new AppError('Only pending acknowledgements can be reviewed', 400);

  await ackRepo.review(ack.id, { status, rejectionReason, reviewedBy });

  if (status === 'rejected') {
    notifyRejection(ack.employeeId, ack.documentId, rejectionReason as string).catch((err: any) =>
      console.error('[doc-ack] Failed to send rejection email:', err.message),
    );
  }
}

async function notifyRejection(employeeId: number, documentId: number, reason: string) {
  if (!process.env.MAIL_HOST) {
    console.info('[doc-ack] MAIL_HOST not set — skipping rejection email');
    return;
  }

  const [employee, document]: [any, any] = await Promise.all([
    employeeRepo.findById(employeeId),
    documentRepo.findById(documentId),
  ]);
  if (!employee?.email || !document) return;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: employee.email,
    subject: `Your signed document was rejected — ${document.title}`,
    html: `
      <p>Hi ${employee.name},</p>
      <p>Your signed copy of <strong>${document.title}</strong> was rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please review the document and upload a corrected signed copy.</p>
      <p><a href="${process.env.FRONTEND_URL}/documents">Go to Documents & Signature</a></p>
      <p style="color:#888;font-size:12px">HR Platform</p>
    `,
  });
}
